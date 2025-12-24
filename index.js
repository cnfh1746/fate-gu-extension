/**
 * 宿命蛊 - 活世界系统
 * Fate Gu Extension for SillyTavern
 * 
 * "定数法则，不可违抗。该死就死，绝不偏袒！"
 */

import { extension_settings, getContext } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";
import {
    loadWorldInfo,
    saveWorldInfo
} from "../../../world-info.js";
import { eventSource, event_types } from "../../../../script.js";

const extensionName = "fate-gu-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}/`;

// ========== 常量定义 ==========
const FATE_ENTRY_COMMENT = "【宿命蛊】世界状态";
const FATE_VARIABLE_COMMENT = "【宿命蛊】变量存储";

// ========== 默认设置 ==========
const defaultSettings = {
    enabled: false,
    targetWorldbook: "",
    contextDepth: 5,
    
    // 触发设置
    triggerMode: "auto", // auto | manual
    
    // API设置
    api: {
        url: "",
        key: "",
        model: "",
        maxTokens: 2000
    },
    
    // 世界状态
    worldState: {
        currentChapter: 1,
        fangYuanLocation: "开窍大典会场",
        fangYuanAction: "刚刚重生",
        dangerLevel: "安全",
        worldDynamic: "开窍大典即将开始",
        isDead: false,
        deathReason: null
    },
    
    // 提示词
    worldUpdatePrompt: `你是【宿命蛊】，蛊真人世界的天道意志。

当前状态：
- 章节：{{currentChapter}}
- 方源位置：{{fangYuanLocation}}
- 玩家位置：{{playerLocation}}

最近对话：
{{recentChat}}

主线事件（第{{currentChapter}}章）：
{{currentEvent}}

任务：
1. 章节+1，更新方源状态
2. 生成本回合世界动态（50字内）
3. 检测玩家是否与方源活动区域交集
4. 判定危险等级：安全/警告/危险/致命
5. 如果玩家触犯禁忌（进入密洞/调查方源/阻挠计划）→ 死亡

输出JSON（必须是有效JSON格式）：
{
  "newChapter": 2,
  "fangYuanLocation": "位置",
  "fangYuanAction": "行动",
  "dangerLevel": "安全",
  "worldDynamic": "动态描述",
  "isDead": false,
  "deathReason": null
}`,

    deathPrompt: `【宿命蛊裁决】

玩家触犯天道禁忌：{{deathReason}}

请以第三人称描写玩家的死亡场景（100字内）。
要求：
- 符合蛊真人世界观
- 冷酷无情，天道视角
- 暗示这是命运的安排`,

    // 主线事件表（前100章示例）
    mainlineEvents: {
        1: { event: "方源重生", location: "开窍大典会场", danger: "低" },
        5: { event: "开窍大典", location: "花海测试", danger: "低" },
        22: { event: "月刃练习", location: "练习场", danger: "中" },
        27: { event: "堵门勒索", location: "学堂门口", danger: "高" },
        32: { event: "漠家冲突", location: "学堂", danger: "高" },
        41: { event: "赌石得蟾", location: "赌石场", danger: "中" },
        43: { event: "酒虫入手", location: "赌石场", danger: "中" },
        46: { event: "密洞杀人", location: "花酒行者密洞", danger: "致命" },
        51: { event: "中阶晋升", location: "住处", danger: "低" },
        68: { event: "猎户之死", location: "山中", danger: "高" },
        78: { event: "王大刺杀", location: "山寨", danger: "高" },
        83: { event: "兄弟对决", location: "擂台", danger: "中" },
        94: { event: "兽潮借刀", location: "山林", danger: "致命" }
    }
};

// ========== 工具函数 ==========

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取最近N楼对话
function getRecentMessages(depth) {
    const context = getContext();
    const chat = context.chat;
    
    if (!chat || chat.length === 0) return [];
    
    const startIndex = Math.max(0, chat.length - depth);
    const recentSlice = chat.slice(startIndex);
    
    const userName = context.name1 || '用户';
    const characterName = context.name2 || '角色';
    
    return recentSlice.map((msg, index) => ({
        floor: startIndex + index + 1,
        author: msg.is_user ? userName : characterName,
        content: msg.mes?.substring(0, 500) || ''
    }));
}

// 调用AI（复用journal-system的逻辑）
async function callAI(messages, retryCount = 0) {
    const settings = extension_settings[extensionName];
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [5000, 10000, 20000];
    
    console.log('[宿命蛊] callAI开始', retryCount > 0 ? `(重试 ${retryCount}/${MAX_RETRIES})` : '');
    
    if (settings.api.url) {
        try {
            let apiUrl = settings.api.url.trim();
            if (!apiUrl.endsWith('/v1/chat/completions')) {
                if (apiUrl.endsWith('/')) {
                    apiUrl = apiUrl.slice(0, -1);
                }
                if (!apiUrl.includes('/v1/chat/completions')) {
                    apiUrl += '/v1/chat/completions';
                }
            }
            
            const requestBody = {
                model: settings.api.model || 'gpt-3.5-turbo',
                messages: messages,
                temperature: 0.7,
                max_tokens: parseInt(settings.api.maxTokens) || 2000
            };
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.api.key || ''}`
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                const shouldRetry = retryCount < MAX_RETRIES && [429, 500, 502, 503, 504].includes(response.status);
                
                if (shouldRetry) {
                    const delay = RETRY_DELAYS[retryCount];
                    console.log(`[宿命蛊] 第${retryCount + 1}次尝试失败(${response.status})，${delay / 1000}秒后重试...`);
                    await sleep(delay);
                    return await callAI(messages, retryCount + 1);
                }
                
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            return data.choices?.[0]?.message?.content || null;
            
        } catch (error) {
            if (retryCount < MAX_RETRIES) {
                const delay = RETRY_DELAYS[retryCount];
                await sleep(delay);
                return await callAI(messages, retryCount + 1);
            }
            console.error('[宿命蛊] API调用失败:', error);
            return null;
        }
    }
    
    // 使用SillyTavern默认API
    try {
        const generateRaw = window.generateRaw || window.Generate?.generateRaw;
        if (!generateRaw) {
            throw new Error('找不到SillyTavern的生成函数');
        }
        
        const prompt = messages.map(m => m.content).join('\n\n');
        const result = await generateRaw(prompt, '', false, false);
        return result;
    } catch (error) {
        console.error('[宿命蛊] ST API调用失败:', error);
        return null;
    }
}

// ========== 核心功能 ==========

// 获取当前章节的主线事件
function getCurrentMainlineEvent(chapter) {
    const settings = extension_settings[extensionName];
    const events = settings.mainlineEvents;
    
    // 找到最近的事件（小于等于当前章节的最大章节号）
    let currentEvent = null;
    let latestChapter = 0;
    
    for (const [ch, event] of Object.entries(events)) {
        const chapterNum = parseInt(ch);
        if (chapterNum <= chapter && chapterNum > latestChapter) {
            latestChapter = chapterNum;
            currentEvent = event;
        }
    }
    
    return currentEvent || { event: "日常", location: "青茅山寨", danger: "低" };
}

// 更新世界状态
async function updateWorldState() {
    const settings = extension_settings[extensionName];
    
    if (!settings.enabled) {
        console.log('[宿命蛊] 未启用');
        return;
    }
    
    try {
        const recentMessages = getRecentMessages(settings.contextDepth);
        const currentEvent = getCurrentMainlineEvent(settings.worldState.currentChapter);
        
        // 构建提示词
        let prompt = settings.worldUpdatePrompt
            .replace('{{currentChapter}}', settings.worldState.currentChapter)
            .replace('{{fangYuanLocation}}', settings.worldState.fangYuanLocation)
            .replace('{{playerLocation}}', '青茅山寨') // TODO: 从对话中提取
            .replace('{{recentChat}}', recentMessages.map(m => `${m.author}: ${m.content}`).join('\n'))
            .replace('{{currentEvent}}', JSON.stringify(currentEvent));
        
        const messages = [
            { role: 'system', content: '你是宿命蛊，蛊真人世界的天道意志。只输出JSON格式的结果。' },
            { role: 'user', content: prompt }
        ];
        
        console.log('[宿命蛊] 正在推进世界...');
        toastr.info('宿命蛊正在推进世界...', '宿命蛊');
        
        const response = await callAI(messages);
        
        if (!response) {
            console.error('[宿命蛊] AI返回为空');
            return;
        }
        
        // 解析JSON响应
        try {
            // 提取JSON部分
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('未找到JSON');
            }
            
            const result = JSON.parse(jsonMatch[0]);
            
            // 更新世界状态
            settings.worldState.currentChapter = result.newChapter || settings.worldState.currentChapter + 1;
            settings.worldState.fangYuanLocation = result.fangYuanLocation || settings.worldState.fangYuanLocation;
            settings.worldState.fangYuanAction = result.fangYuanAction || settings.worldState.fangYuanAction;
            settings.worldState.dangerLevel = result.dangerLevel || '安全';
            settings.worldState.worldDynamic = result.worldDynamic || '';
            
            // 检查是否死亡
            if (result.isDead) {
                settings.worldState.isDead = true;
                settings.worldState.deathReason = result.deathReason;
                await handleDeath(result.deathReason);
            } else {
                // 写入世界书
                await writeWorldStateToLorebook();
                toastr.success(`第${settings.worldState.currentChapter}章 - ${settings.worldState.dangerLevel}`, '宿命蛊');
            }
            
            saveSettingsDebounced();
            updateStatusDisplay();
            
        } catch (parseError) {
            console.error('[宿命蛊] JSON解析失败:', parseError);
            console.log('[宿命蛊] 原始响应:', response);
            
            // 尝试手动推进章节
            settings.worldState.currentChapter += 1;
            saveSettingsDebounced();
            updateStatusDisplay();
        }
        
    } catch (error) {
        console.error('[宿命蛊] 更新世界状态失败:', error);
        toastr.error(`更新失败: ${error.message}`, '宿命蛊');
    }
}

// 处理死亡
async function handleDeath(reason) {
    const settings = extension_settings[extensionName];
    
    // 生成死亡描写
    const deathPrompt = settings.deathPrompt.replace('{{deathReason}}', reason);
    const messages = [
        { role: 'system', content: '你是蛊真人小说的叙述者。' },
        { role: 'user', content: deathPrompt }
    ];
    
    toastr.error('天道裁决，命运终结...', '宿命蛊');
    
    const deathDescription = await callAI(messages);
    
    // 显示死亡模态框
    showDeathModal(reason, deathDescription);
    
    // 重置世界状态
    await resetWorldState();
}

// 显示死亡模态框
function showDeathModal(reason, description) {
    const modal = $('<div class="fate-gu-death-modal"></div>');
    const content = $(`
        <div class="fate-gu-death-content">
            <h2>【宿命蛊裁决】</h2>
            <p>${description || '你的生命在这一刻终结。'}</p>
            <p class="rebirth-text">
                你的意识消散在无尽的黑暗中...<br>
                当再次睁眼，是那个熟悉的清晨。<br>
                开窍大典的钟声即将响起。<br>
                <strong>宿命轮回，重新开始。</strong>
            </p>
            <button class="fate-gu-btn fate-gu-btn-primary" id="fate-gu-rebirth">确认轮回</button>
        </div>
    `);
    
    modal.append(content);
    $('body').append(modal);
    
    modal.find('#fate-gu-rebirth').on('click', function() {
        modal.remove();
    });
}

// 重置世界状态
async function resetWorldState() {
    const settings = extension_settings[extensionName];
    
    settings.worldState = {
        currentChapter: 1,
        fangYuanLocation: "开窍大典会场",
        fangYuanAction: "刚刚重生",
        dangerLevel: "安全",
        worldDynamic: "开窍大典即将开始",
        isDead: false,
        deathReason: null
    };
    
    saveSettingsDebounced();
    updateStatusDisplay();
    
    // 更新世界书
    await writeWorldStateToLorebook();
    
    toastr.info('世界已重置到第1章', '宿命蛊');
}

// 写入世界状态到世界书
async function writeWorldStateToLorebook() {
    const settings = extension_settings[extensionName];
    
    if (!settings.targetWorldbook) {
        console.log('[宿命蛊] 未指定目标世界书');
        return;
    }
    
    try {
        let bookData;
        try {
            bookData = await loadWorldInfo(settings.targetWorldbook);
        } catch (e) {
            bookData = { entries: {}, name: settings.targetWorldbook };
        }
        
        if (!bookData.entries) {
            bookData.entries = {};
        }
        
        // 查找或创建宿命蛊条目
        let fateEntry = Object.values(bookData.entries).find(
            e => e.comment === FATE_ENTRY_COMMENT
        );
        
        const currentEvent = getCurrentMainlineEvent(settings.worldState.currentChapter);
        
        const content = `<fate_gu>
【当前章节】第${settings.worldState.currentChapter}章
【方源位置】${settings.worldState.fangYuanLocation}
【方源行动】${settings.worldState.fangYuanAction}
【当前事件】${currentEvent.event}
【危险等级】${settings.worldState.dangerLevel}
【世界动态】${settings.worldState.worldDynamic}
</fate_gu>`;
        
        if (fateEntry) {
            fateEntry.content = content;
        } else {
            const entryKey = Object.keys(bookData.entries).length.toString();
            fateEntry = {
                uid: parseInt(entryKey),
                key: [],
                keysecondary: [],
                comment: FATE_ENTRY_COMMENT,
                content: content,
                constant: true,
                selective: false,
                order: 100,
                position: 0,
                disable: false,
                excludeRecursion: true,
                preventRecursion: true,
                probability: 100,
                useProbability: true,
                depth: 4
            };
            bookData.entries[entryKey] = fateEntry;
        }
        
        await saveWorldInfo(settings.targetWorldbook, bookData, true);
        console.log('[宿命蛊] 世界状态已写入世界书');
        
    } catch (error) {
        console.error('[宿命蛊] 写入世界书失败:', error);
    }
}

// 更新状态显示
function updateStatusDisplay() {
    const settings = extension_settings[extensionName];
    
    $('#fate-gu-chapter').text(`第${settings.worldState.currentChapter}章`);
    $('#fate-gu-location').text(settings.worldState.fangYuanLocation);
    $('#fate-gu-action').text(settings.worldState.fangYuanAction);
    
    const dangerElement = $('#fate-gu-danger');
    dangerElement.text(settings.worldState.dangerLevel);
    dangerElement.removeClass('danger-safe danger-warning danger-danger danger-fatal');
    
    switch (settings.worldState.dangerLevel) {
        case '安全': dangerElement.addClass('danger-safe'); break;
        case '警告': dangerElement.addClass('danger-warning'); break;
        case '危险': dangerElement.addClass('danger-danger'); break;
        case '致命': dangerElement.addClass('danger-fatal'); break;
    }
    
    $('#fate-gu-dynamic').text(settings.worldState.worldDynamic || '-');
}

// ========== 初始化 ==========

jQuery(async () => {
    // 加载设置
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = {};
    }
    Object.assign(extension_settings[extensionName], { ...defaultSettings, ...extension_settings[extensionName] });
    
    // 加载设置界面
    const settingsHtml = await $.get(`${extensionFolderPath}settings.html`);
    $('#extensions_settings2').append(settingsHtml);
    
    const settings = extension_settings[extensionName];
    
    // 绑定控件
    $('#fate-gu-enabled').prop('checked', settings.enabled).on('change', function() {
        settings.enabled = $(this).is(':checked');
        saveSettingsDebounced();
    });
    
    $('#fate-gu-worldbook').val(settings.targetWorldbook).on('input', function() {
        settings.targetWorldbook = $(this).val();
        saveSettingsDebounced();
    });
    
    $('#fate-gu-context-depth').val(settings.contextDepth).on('input', function() {
        settings.contextDepth = parseInt($(this).val()) || 5;
        saveSettingsDebounced();
    });
    
    $('#fate-gu-api-url').val(settings.api.url).on('input', function() {
        settings.api.url = $(this).val();
        saveSettingsDebounced();
    });
    
    $('#fate-gu-api-key').val(settings.api.key).on('input', function() {
        settings.api.key = $(this).val();
        saveSettingsDebounced();
    });
    
    $('#fate-gu-api-model').val(settings.api.model).on('input', function() {
        settings.api.model = $(this).val();
        saveSettingsDebounced();
    });
    
    $('#fate-gu-world-prompt').val(settings.worldUpdatePrompt).on('input', function() {
        settings.worldUpdatePrompt = $(this).val();
        saveSettingsDebounced();
    });
    
    // 按钮事件
    $('#fate-gu-manual-update').on('click', async function() {
        await updateWorldState();
    });
    
    $('#fate-gu-reset').on('click', async function() {
        if (confirm('确定要重置世界状态吗？将回到第1章。')) {
            await resetWorldState();
        }
    });
    
    // 初始化状态显示
    updateStatusDisplay();
    
    // 监听消息事件（自动触发）
    if (settings.triggerMode === 'auto') {
        eventSource.on(event_types.MESSAGE_RECEIVED, async () => {
            if (settings.enabled) {
                await updateWorldState();
            }
        });
    }
    
    console.log('[宿命蛊] 扩展已加载');
});
