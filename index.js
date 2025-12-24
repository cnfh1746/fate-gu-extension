/**
 * 宿命蛊 - 活世界系统 v2.0
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

// ========== 主线事件详情表 ==========
const MAINLINE_DETAILS = {
    1: {
        event: "方源重生",
        time: "开窍大典前夜",
        detail: "方源利用六转本命蛊春秋蝉重生回500年前",
        keyInfo: "方源是500岁魔道巨擘，心智远超常人，面无表情"
    },
    5: {
        event: "开窍大典",
        time: "开窍大典当日·辰时",
        detail: "测试结果：方源丙等资质（27步，44%元海），方正甲等资质（43步）。家族态度瞬间逆转，方源遭冷遇",
        keyInfo: "沈翠开始疏远方源，舅父舅母露出本性，方正被族长带走特训"
    },
    6: {
        event: "兄弟反差",
        time: "开窍大典后",
        detail: "只有方源知道资质真相，心态平稳。方正因长期被方源压制，产生心理阴影",
        keyInfo: "方正誓要超越哥哥"
    },
    22: {
        event: "月刃飞舞",
        time: "入学后一月",
        detail: "方源在练习课上隐藏实力，最后两击精准斩断草人头颅，震慑全场，夺得第一",
        keyInfo: "方源展露锋芒"
    },
    23: {
        event: "养蛊如养情妇",
        time: "入学后",
        detail: "方源面临严重经济危机（每天消耗1块元石）",
        keyInfo: "炼蛊难，养蛊更难"
    },
    27: {
        event: "堵门勒索",
        time: "入学后一月余",
        detail: "方源在学堂门口强收保护费，每人1块元石，打伤多人立威",
        keyInfo: "学堂门口极度危险，方源心狠手辣"
    },
    32: {
        event: "漠家冲突",
        time: "入学后两月",
        detail: "方源打伤漠家小少爷古月漠北，漠家是三大家族势力之一",
        keyInfo: "方源树敌漠家"
    },
    41: {
        event: "赌石得蟾",
        time: "入学后三月",
        detail: "方源利用500年记忆，在赌石场切出癞土蛤蟆（二转稀有蛊）作掩护",
        keyInfo: "赌石场有机遇"
    },
    43: {
        event: "酒虫入手",
        time: "入学后三月",
        detail: "真实目的是获得酒虫（一转珍稀蛊，可提炼真元）",
        keyInfo: "酒虫是方源崛起关键"
    },
    46: {
        event: "密洞杀人",
        time: "入学后四月",
        detail: "方源带贾金生进入花酒行者密洞，两记月刃斩首贾金生灭口",
        keyInfo: "花酒行者密洞是禁地，进入者必死"
    },
    51: {
        event: "中阶晋升",
        time: "五月后",
        detail: "方源利用勒索所得元石，强行突破至一转中阶",
        keyInfo: "方源实力增长"
    },
    68: {
        event: "猎户之死",
        time: "半年后",
        detail: "方源杀死王老汉一家，发现王老汉长子王大是魔道蛊师",
        keyInfo: "山中有野兽和猎户，危险"
    },
    78: {
        event: "王大刺杀",
        time: "年末前",
        detail: "王大误将方正当作方源刺杀，方正重伤，王大被围杀",
        keyInfo: "方正因祸得福获族长亲自教导"
    },
    83: {
        event: "兄弟对决",
        time: "年末考核",
        detail: "方源（一转巅峰）徒手击破方正（二转）的玉皮蛊防御，夺得第一",
        keyInfo: "方源战斗经验远超同龄人"
    },
    94: {
        event: "兽潮借刀",
        time: "次年初",
        detail: "方源借野猪王之手害死队友，在兽潮中借刀杀人",
        keyInfo: "兽潮期间山林极度危险"
    }
};

// ========== 默认设置 ==========
const defaultSettings = {
    enabled: false,
    targetWorldbook: "",
    contextDepth: 5,
    triggerMode: "auto",

    api: {
        url: "",
        key: "",
        model: "",
        maxTokens: 3000
    },

    // 完整世界状态
    worldState: {
        // 时间
        time: "开窍大典前夜",
        chapter: 1,

        // 方源状态
        fangYuan: {
            location: "住所",
            action: "刚刚重生，躺在床上思索"
        },

        // NPC状态
        npcs: {
            "方正": { status: "熟睡中", plan: "明日开窍大典" },
            "沈翠": { status: "休息", plan: "伺候方源" },
            "舅父舅母": { status: "休息", plan: "观望开窍结果" }
        },

        // 地点状态
        locations: {
            "花海会场": "空无一人，明日大典",
            "学堂": "夜间关闭",
            "住所区": "众人休息"
        },

        // 玩家状态
        player: {
            cultivation: "凡人",
            money: 0,
            gu: [],
            location: "青茅山寨",
            identity: "古月族普通少年"
        },

        // 事件
        currentEvent: "方源重生",
        nextEvent: "开窍大典即将开始",
        worldDynamic: "夜深人静，青茅山寨笼罩在春雨的湿润中",

        // 危险
        danger: "安全",
        dangerSource: null,
        isDead: false,
        deathReason: null
    },

    // 提示词
    worldUpdatePrompt: `你是【宿命蛊】，蛊真人世界的天道意志。掌控命运，绝不偏袒。

【当前状态】
时间：{{time}}
章节：第{{chapter}}章
方源：{{fangYuanLocation}} - {{fangYuanAction}}

【玩家状态】
位置：{{playerLocation}}
修为：{{playerCultivation}}
元石：{{playerMoney}}
蛊虫：{{playerGu}}

【本章主线命运】
{{mainlineDetail}}

【最近对话】
{{recentChat}}

【任务】
1. 推进时间（根据对话内容判断时间流逝）
2. 推进章节（如果触发重大事件则+1）
3. 更新方源状态（位置、行动）
4. 更新NPC状态（方正、沈翠、舅父舅母的状态和计划）
5. 更新地点状态
6. 生成世界动态（100字内，描述世界正在发生的事）
7. 评估玩家危险（来源可能是：方源/野兽/其他蛊师/环境/资源匮乏）
8. 更新玩家属性（如果对话中有变化）
9. 判断是否死亡

【输出JSON】必须是有效JSON格式：
{
  "time": "时间描述",
  "chapter": 数字,
  "fangYuan": {
    "location": "位置",
    "action": "行动描述"
  },
  "npcs": {
    "方正": {"status": "状态", "plan": "计划"},
    "沈翠": {"status": "状态", "plan": "计划"},
    "舅父舅母": {"status": "状态", "plan": "计划"}
  },
  "locations": {
    "花海会场": "状态",
    "学堂": "状态",
    "住所区": "状态"
  },
  "player": {
    "cultivation": "修为",
    "money": 数字,
    "gu": ["蛊虫列表"],
    "location": "位置"
  },
  "currentEvent": "当前事件",
  "nextEvent": "即将发生",
  "worldDynamic": "世界动态描述",
  "danger": "安全/警告/危险/致命",
  "dangerSource": "危险来源或null",
  "isDead": false,
  "deathReason": null
}`,

    deathPrompt: `【宿命蛊裁决】

死亡原因：{{deathReason}}

请以第三人称描写玩家的死亡场景（150字内）。
要求：
- 符合蛊真人世界观
- 冷酷无情，天道视角
- 描写具体死亡过程`
};

// ========== 工具函数 ==========

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

function getMainlineDetail(chapter) {
    let detail = null;
    let latestChapter = 0;

    for (const [ch, info] of Object.entries(MAINLINE_DETAILS)) {
        const chapterNum = parseInt(ch);
        if (chapterNum <= chapter && chapterNum > latestChapter) {
            latestChapter = chapterNum;
            detail = info;
        }
    }

    return detail || { event: "日常", time: "青茅山寨", detail: "平静的一天", keyInfo: "无特殊事件" };
}

async function callAI(messages, retryCount = 0) {
    const settings = extension_settings[extensionName];
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [5000, 10000, 20000];

    console.log('[宿命蛊] callAI开始', retryCount > 0 ? `(重试 ${retryCount}/${MAX_RETRIES})` : '');

    if (settings.api.url) {
        try {
            let apiUrl = settings.api.url.trim();
            if (!apiUrl.endsWith('/v1/chat/completions')) {
                if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
                if (!apiUrl.includes('/v1/chat/completions')) apiUrl += '/v1/chat/completions';
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.api.key || ''}`
                },
                body: JSON.stringify({
                    model: settings.api.model || 'gpt-3.5-turbo',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: parseInt(settings.api.maxTokens) || 3000
                })
            });

            if (!response.ok) {
                if (retryCount < MAX_RETRIES && [429, 500, 502, 503, 504].includes(response.status)) {
                    await sleep(RETRY_DELAYS[retryCount]);
                    return await callAI(messages, retryCount + 1);
                }
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || null;

        } catch (error) {
            if (retryCount < MAX_RETRIES) {
                await sleep(RETRY_DELAYS[retryCount]);
                return await callAI(messages, retryCount + 1);
            }
            console.error('[宿命蛊] API调用失败:', error);
            return null;
        }
    }

    try {
        const generateRaw = window.generateRaw || window.Generate?.generateRaw;
        if (!generateRaw) throw new Error('找不到SillyTavern的生成函数');
        return await generateRaw(messages.map(m => m.content).join('\n\n'), '', false, false);
    } catch (error) {
        console.error('[宿命蛊] ST API调用失败:', error);
        return null;
    }
}

// ========== 核心功能 ==========

async function updateWorldState() {
    const settings = extension_settings[extensionName];

    if (!settings.enabled) {
        console.log('[宿命蛊] 未启用');
        return;
    }

    try {
        const recentMessages = getRecentMessages(settings.contextDepth);
        const mainline = getMainlineDetail(settings.worldState.chapter);
        const ws = settings.worldState;

        let prompt = settings.worldUpdatePrompt
            .replace('{{time}}', ws.time)
            .replace('{{chapter}}', ws.chapter)
            .replace('{{fangYuanLocation}}', ws.fangYuan.location)
            .replace('{{fangYuanAction}}', ws.fangYuan.action)
            .replace('{{playerLocation}}', ws.player.location)
            .replace('{{playerCultivation}}', ws.player.cultivation)
            .replace('{{playerMoney}}', ws.player.money)
            .replace('{{playerGu}}', ws.player.gu.length > 0 ? ws.player.gu.join(', ') : '无')
            .replace('{{mainlineDetail}}', `${mainline.event}：${mainline.detail}\n关键信息：${mainline.keyInfo}`)
            .replace('{{recentChat}}', recentMessages.map(m => `${m.author}: ${m.content}`).join('\n'));

        const messages = [
            { role: 'system', content: '你是宿命蛊，蛊真人世界的天道意志。只输出JSON格式的结果，不要任何解释。' },
            { role: 'user', content: prompt }
        ];

        console.log('[宿命蛊] 正在推进世界...');
        toastr.info('宿命蛊正在推进世界...', '宿命蛊');

        const response = await callAI(messages);

        if (!response) {
            console.error('[宿命蛊] AI返回为空');
            toastr.error('AI返回为空', '宿命蛊');
            return;
        }

        console.log('[宿命蛊] AI响应:', response.substring(0, 500));

        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.error('[宿命蛊] JSON匹配失败，原始响应:', response);
                throw new Error('未找到JSON');
            }

            console.log('[宿命蛊] 提取的JSON:', jsonMatch[0].substring(0, 300));

            const result = JSON.parse(jsonMatch[0]);

            console.log('[宿命蛊] 解析结果:', result);

            // 更新世界状态 - 章节强制+1
            ws.time = result.time || ws.time;
            ws.chapter = (result.chapter !== undefined && result.chapter > ws.chapter) ? result.chapter : ws.chapter + 1;
            console.log('[宿命蛊] 新章节:', ws.chapter);

            if (result.fangYuan) {
                ws.fangYuan.location = result.fangYuan.location || ws.fangYuan.location;
                ws.fangYuan.action = result.fangYuan.action || ws.fangYuan.action;
            }

            if (result.npcs) ws.npcs = result.npcs;
            if (result.locations) ws.locations = result.locations;

            if (result.player) {
                ws.player.cultivation = result.player.cultivation || ws.player.cultivation;
                ws.player.money = result.player.money ?? ws.player.money;
                ws.player.gu = result.player.gu || ws.player.gu;
                ws.player.location = result.player.location || ws.player.location;
            }

            ws.currentEvent = result.currentEvent || ws.currentEvent;
            ws.nextEvent = result.nextEvent || ws.nextEvent;
            ws.worldDynamic = result.worldDynamic || ws.worldDynamic;
            ws.danger = result.danger || '安全';
            ws.dangerSource = result.dangerSource;

            if (result.isDead) {
                ws.isDead = true;
                ws.deathReason = result.deathReason;
                await handleDeath(result.deathReason);
            } else {
                await writeWorldStateToLorebook();
                toastr.success(`第${ws.chapter}章 - ${ws.danger}`, '宿命蛊');
            }

            saveSettingsDebounced();
            updateStatusDisplay();

        } catch (parseError) {
            console.error('[宿命蛊] JSON解析失败:', parseError, response);
            ws.chapter += 1;
            saveSettingsDebounced();
            updateStatusDisplay();
        }

    } catch (error) {
        console.error('[宿命蛊] 更新世界状态失败:', error);
        toastr.error(`更新失败: ${error.message}`, '宿命蛊');
    }
}

async function handleDeath(reason) {
    const settings = extension_settings[extensionName];

    const deathPrompt = settings.deathPrompt.replace('{{deathReason}}', reason);
    const messages = [
        { role: 'system', content: '你是蛊真人小说的叙述者。' },
        { role: 'user', content: deathPrompt }
    ];

    toastr.error('天道裁决，命运终结...', '宿命蛊');

    const deathDescription = await callAI(messages);
    showDeathModal(reason, deathDescription);
    await resetWorldState();
}

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
    modal.find('#fate-gu-rebirth').on('click', () => modal.remove());
}

async function resetWorldState() {
    const settings = extension_settings[extensionName];

    settings.worldState = {
        time: "开窍大典前夜",
        chapter: 1,
        fangYuan: { location: "住所", action: "刚刚重生，躺在床上思索" },
        npcs: {
            "方正": { status: "熟睡中", plan: "明日开窍大典" },
            "沈翠": { status: "休息", plan: "伺候方源" },
            "舅父舅母": { status: "休息", plan: "观望开窍结果" }
        },
        locations: {
            "花海会场": "空无一人，明日大典",
            "学堂": "夜间关闭",
            "住所区": "众人休息"
        },
        player: { cultivation: "凡人", money: 0, gu: [], location: "青茅山寨", identity: "古月族普通少年" },
        currentEvent: "方源重生",
        nextEvent: "开窍大典即将开始",
        worldDynamic: "夜深人静，青茅山寨笼罩在春雨的湿润中",
        danger: "安全",
        dangerSource: null,
        isDead: false,
        deathReason: null
    };

    saveSettingsDebounced();
    updateStatusDisplay();
    await writeWorldStateToLorebook();
    toastr.info('世界已重置到第1章', '宿命蛊');
}

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

        if (!bookData.entries) bookData.entries = {};

        let fateEntry = Object.values(bookData.entries).find(e => e.comment === FATE_ENTRY_COMMENT);

        const ws = settings.worldState;
        const mainline = getMainlineDetail(ws.chapter);

        // 格式化NPC状态
        let npcText = '';
        for (const [name, info] of Object.entries(ws.npcs)) {
            npcText += `【${name}】${info.status} | 计划：${info.plan}\n`;
        }

        // 格式化地点状态
        let locText = '';
        for (const [loc, status] of Object.entries(ws.locations)) {
            locText += `- ${loc}：${status}\n`;
        }

        const content = `<fate_gu>
【时间】${ws.time}

【命运】第${ws.chapter}章 - ${mainline.event}
${mainline.detail}
关键信息：${mainline.keyInfo}

【方源】${ws.fangYuan.location} - ${ws.fangYuan.action}

【关键NPC】
${npcText}
【地点状态】
${locText}
【玩家】
- 修为：${ws.player.cultivation}
- 元石：${ws.player.money}
- 蛊虫：${ws.player.gu.length > 0 ? ws.player.gu.join(', ') : '无'}
- 位置：${ws.player.location}
- 危险：${ws.danger}${ws.dangerSource ? `（来源：${ws.dangerSource}）` : ''}

【世界动态】${ws.worldDynamic}
【即将发生】${ws.nextEvent}
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

function updateStatusDisplay() {
    const settings = extension_settings[extensionName];
    const ws = settings.worldState;

    $('#fate-gu-chapter').text(`第${ws.chapter}章`);
    $('#fate-gu-time').text(ws.time);
    $('#fate-gu-location').text(ws.fangYuan.location);
    $('#fate-gu-action').text(ws.fangYuan.action);
    $('#fate-gu-player-cultivation').text(ws.player.cultivation);
    $('#fate-gu-player-money').text(ws.player.money);
    $('#fate-gu-player-gu').text(ws.player.gu.length > 0 ? ws.player.gu.join(', ') : '无');

    const dangerElement = $('#fate-gu-danger');
    dangerElement.text(ws.danger + (ws.dangerSource ? `（${ws.dangerSource}）` : ''));
    dangerElement.removeClass('danger-safe danger-warning danger-danger danger-fatal');

    switch (ws.danger) {
        case '安全': dangerElement.addClass('danger-safe'); break;
        case '警告': dangerElement.addClass('danger-warning'); break;
        case '危险': dangerElement.addClass('danger-danger'); break;
        case '致命': dangerElement.addClass('danger-fatal'); break;
    }

    $('#fate-gu-dynamic').text(ws.worldDynamic || '-');
}

// ========== 初始化 ==========

jQuery(async () => {
    if (!extension_settings[extensionName]) {
        extension_settings[extensionName] = {};
    }
    Object.assign(extension_settings[extensionName], { ...defaultSettings, ...extension_settings[extensionName] });

    const settingsHtml = await $.get(`${extensionFolderPath}settings.html`);
    $('#extensions_settings2').append(settingsHtml);

    const settings = extension_settings[extensionName];

    // 绑定控件
    $('#fate-gu-enabled').prop('checked', settings.enabled).on('change', function () {
        settings.enabled = $(this).is(':checked');
        saveSettingsDebounced();
    });

    $('#fate-gu-worldbook').val(settings.targetWorldbook).on('input', function () {
        settings.targetWorldbook = $(this).val();
        saveSettingsDebounced();
    });

    $('#fate-gu-context-depth').val(settings.contextDepth).on('input', function () {
        settings.contextDepth = parseInt($(this).val()) || 5;
        saveSettingsDebounced();
    });

    $('#fate-gu-api-url').val(settings.api.url).on('input', function () {
        settings.api.url = $(this).val();
        saveSettingsDebounced();
    });

    $('#fate-gu-api-key').val(settings.api.key).on('input', function () {
        settings.api.key = $(this).val();
        saveSettingsDebounced();
    });

    $('#fate-gu-api-model').val(settings.api.model).on('input', function () {
        settings.api.model = $(this).val();
        saveSettingsDebounced();
    });

    $('#fate-gu-world-prompt').val(settings.worldUpdatePrompt).on('input', function () {
        settings.worldUpdatePrompt = $(this).val();
        saveSettingsDebounced();
    });

    $('#fate-gu-manual-update').on('click', async function () {
        await updateWorldState();
    });

    $('#fate-gu-reset').on('click', async function () {
        if (confirm('确定要重置世界状态吗？将回到第1章。')) {
            await resetWorldState();
        }
    });

    updateStatusDisplay();

    if (settings.triggerMode === 'auto') {
        eventSource.on(event_types.MESSAGE_RECEIVED, async () => {
            if (settings.enabled) {
                await updateWorldState();
            }
        });
    }

    console.log('[宿命蛊] 扩展已加载 v2.0');
});
