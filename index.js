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

// ========== 主线事件详情表（完整1-119章）==========
const MAINLINE_DETAILS = {
    1: { event: "纵身亡魔心仍不悔", time: "重生之夜", detail: "方源遭正道围攻，利用六转本命蛊春秋蝉自爆，重生回五百年前的古月山寨", keyInfo: "蛊虫:春秋蝉(六转,逆转光阴) 角色:方源(魔尊重生)" },
    2: { event: "逆光阴五百年觉悟", time: "重生第一天", detail: "方源确认重生事实，制定利用先知先觉抢占机缘的计划。弟弟古月方正登场，表现怯懦自卑", keyInfo: "角色:古月方正(弟,未来宿敌), 舅父舅母(贪图遗产)" },
    3: { event: "请一边玩蛋去", time: "开窍大典当日·五更", detail: "方源拒绝丫鬟沈翠引诱，看穿其背叛本性。兄弟前往大典，方源无视外界议论", keyInfo: "角色:沈翠(丫鬟,眼线) 心态:旁人失望与我何干" },
    4: { event: "古月方源！", time: "开窍大典·上午", detail: "大典开始。古月漠北乙等。古月赤城作弊得乙等（祖父赤练家老掩护）。家族派系斗争初显", keyInfo: "伏笔:古月赤城作弊(其实丙等) 势力:漠脉vs赤脉" },
    5: { event: "人祖三蛊，希望开窍", time: "开窍大典", detail: "方源渡河，引出人祖传传说（力量、智慧、希望）。利用希望蛊成功开窍", keyInfo: "蛊虫:希望蛊(开窍用) 设定:人祖传(力量,智慧,希望)" },
    6: { event: "未来的路，会很精彩", time: "开窍大典·资质公布", detail: "方源测出丙等资质（四成四元海），众人失望嘲讽。方正测出甲等资质，全族沸腾，族长古月博宣布亲自收养", keyInfo: "资质:方源(丙等), 方正(甲等) 转折:兄弟命运分叉点" },
    7: { event: "蛊师有九转，花酒留遗藏", time: "入学后", detail: "家老讲解九转等级。方源每晚外出寻找五转魔修花酒行者的遗藏，试图用酒吸引酒虫，暂未果", keyInfo: "传承:花酒行者(五转魔头) 目标:寻找酒虫" },
    8: { event: "物是人非", time: "入学后", detail: "众人领取本命蛊，方源领取月光蛊。方正试图展现优越感与关心，被方源无视", keyInfo: "蛊虫:月光蛊(一转,基础攻击) 关系:方正心态扭曲" },
    9: { event: "渐行渐远", time: "入学后", detail: "舅父舅母收养方正以合法霸占遗产，方源拒绝被收养。舅父舅母密谋制造丑闻将方源逐出家族", keyInfo: "阴谋:舅父舅母欲夺产驱逐" },
    10: { event: "天有不测风云，炼蛊别具艰辛", time: "入学后", detail: "连日大雨阻碍搜寻酒虫。方源决定在房内先炼化月光蛊。描述炼化过程之艰难与真元消耗", keyInfo: "设定:炼蛊消耗真元、意志比拼" },
    11: { event: "不过是色诱罢了", time: "入学后", detail: "沈翠受舅父指使色诱方源以图栽赃。方源暴力破解并恐吓沈翠，随后搬离舅父家入住客栈", keyInfo: "智谋:识破色诱局 行动:离家独立" },
    12: { event: "青竹酒香，蛊师逞威", time: "入学后", detail: "客栈中猎户误买青竹酒遭一转蛊师江牙羞辱。方源买下此酒震慑江牙，并获寻虫关键道具", keyInfo: "物品:青竹酒(诱饵) 世界观:蛊师地位超然" },
    13: { event: "月下竹林，一点珠雪", time: "入学后", detail: "方源在竹林孤注一掷倒出青竹酒，终于散发极致酒香，成功引出贪杯的酒虫", keyInfo: "关键:成功引出酒虫 蛊虫:酒虫(珍稀一转蛊)" },
    14: { event: "山缝之中藏玄机", time: "入学后", detail: "方源追踪醉酒的酒虫钻入山壁石缝，发现隐秘洞穴及花酒行者遗骸", keyInfo: "地点:瀑布后山壁秘洞 遗迹:花酒遗藏入口" },
    15: { event: "历史由胜利者书写", time: "入学后", detail: "触发留影存声蛊，揭露三百年前真相：四代族长卑鄙偷袭花酒行者不成反被杀。家族历史全是谎言", keyInfo: "真相:四代族长是伪君子 蛊虫:留影存声蛊(记录影像)" },
    16: { event: "尽收囊中", time: "入学后", detail: "方源决定隐瞒遗藏，独吞利益。搜刮得15块元石及酒虫", keyInfo: "抉择:独吞遗藏 收获:酒虫(提升资质关键)" },
    17: { event: "初炼酒虫", time: "入学后", detail: "方源尝试炼化酒虫，因其中残留花酒行者（五转）的意志而进展极慢。危机时刻，本以为丢失的春秋蝉在空窍中显现", keyInfo: "转折:春秋蝉现身（本命蛊）" },
    18: { event: "就让往事如烟飘散", time: "入学后", detail: "方正为沈翠质问方源，反遭方源掌掴教训。方源以6块元石将沈翠卖给方正，彻底斩断兄弟情义", keyInfo: "手段:卖人赚资 关系:兄弟决裂" },
    19: { event: "六转本命春秋蝉！", time: "入学后", detail: "方源发现春秋蝉虽极度虚弱但正好能被一转空窍容纳。利用其六转气息瞬间压制并炼化酒虫与月光蛊", keyInfo: "外挂:春秋蝉威压(炼蛊作弊器)" },
    21: { event: "怎么会是哥哥得了这第一？", time: "入学后", detail: "方正得知哥哥夺冠，心态崩塌。家族各派系反应不一，方源的胜利被归结为运气", keyInfo: "对比:兄弟地位反转" },
    22: { event: "月刃飞舞", time: "入学后一月", detail: "家老演示月刃，方源在考核练习中一鸣惊人", keyInfo: "技能:月刃(远程攻击)" },
    23: { event: "养蛊就像养情妇", time: "入学后一月", detail: "方源计算养蛊开销（月光蛊+酒虫+春秋蝉），发现资金短缺，决定通过勒索同窗来搞钱", keyInfo: "名言:养蛊如养情妇" },
    24: { event: "近战蛊师", time: "入学后一月", detail: "拳脚课。方源鄙视同龄人忽视基础格斗。为后续勒索埋下伏笔", keyInfo: "伏笔:基础拳脚的重要性" },
    25: { event: "春光正明媚", time: "入学后一月", detail: "月刃考核。方源故意打偏两记，最后一记双发齐中，斩断守擂草人头颅，再次夺魁，击碎方正信心", keyInfo: "爽点:实力碾压，再次夺魁" },
    26: { event: "一切组织的本质", time: "入学后一月", detail: "课堂宣布设立班头制度。方源洞悉体制本质是资源分配。放学后堵门勒索每人一元石", keyInfo: "金句:组织本质是吃人/分蛋糕" },
    27: { event: "公然勒索", time: "入学后一月余", detail: "众人不服，方源依靠丰富战斗经验，通过拳脚痛殴所有挑战者（包括漠北），成功勒索", keyInfo: "事件:首次堵门勒索 学堂门口极度危险" },
    28: { event: "无本生意！", time: "入学后一月余", detail: "家老默许甚至欣赏方源的斗志与分寸。漠颜被勒索后叫来家奴找场子", keyInfo: "反应:高层默许，视为磨练" },
    29: { event: "不择手段", time: "入学后一月余", detail: "方源用勒索来的钱且买酒。利用酒虫提炼真元至伪中阶", keyInfo: "修炼:提炼出中阶真元" },
    30: { event: "方源！你又来抢？", time: "入学后一月余", detail: "舅父舅母试图利用此事孤立方源。方源再次堵门勒索，将所有学员打服", keyInfo: "成就:全班公敌" },
    31: { event: "方源，你大祸临头了！", time: "入学后一月余", detail: "漠北向姐姐漠颜告状。漠颜带家奴高碗去客栈找方源麻烦", keyInfo: "冲突:惹上二转蛊师" },
    32: { event: "戏耍", time: "入学后两月", detail: "漠颜带人兴师问罪。方源利用语言漏洞将漠颜骗至学堂宿舍", keyInfo: "智斗:耍弄漠颜" },
    33: { event: "你骂吧", time: "入学后两月", detail: "漠颜被族规（宿舍禁武）限制，不敢动手。方源开门修炼，将其无视", keyInfo: "心理战:利用规则束缚对手" },
    34: { event: "压着你打！", time: "入学后两月", detail: "深夜，方源出门。两人生死搏斗，方源发现仅凭拳脚难敌练家子高碗（凡人巅峰）", keyInfo: "战斗:方源vs高碗(拳脚劣势)" },
    35: { event: "你叫吧", time: "入学后两月", detail: "方源悍然违规动用月光蛊，凭借中阶真元威力斩断高碗双臂，追杀并斩首高碗", keyInfo: "杀伐:首次杀人，斩首家奴" },
    36: { event: "分尸送礼！", time: "入学后两月", detail: "学堂震动。方源被问责，谎称自卫，并透露已将尸体剁碎送往漠家后门", keyInfo: "狠辣:碎尸警告" },
    37: { event: "既是妥协又是威胁", time: "入学后两月", detail: "漠家家老漠尘收到碎尸盒，解读出方源的妥协与威胁，决定平息此事并赔偿方源", keyInfo: "博弈:看透规则，反赚赔偿" },
    38: { event: "魔头在光明中行走", time: "入学后两月", detail: "方源听人祖传说（规矩蛊），感悟世间规则。自比魔头在光明中行走，一切规矩皆为我用", keyInfo: "哲思:规矩论，人祖传" },
    39: { event: "蛤蟆商队", time: "入学后三月", detail: "商队迟来但终到。方源怀揣巨款（近百元石），进入商队寻找机缘", keyInfo: "新地图:贾家商队" },
    40: { event: "紫金石中蟾蛊眠", time: "入学后三月", detail: "方源进入赌石场，凭借前世记忆寻找藏有癞土蛤蟆的紫金化石", keyInfo: "机缘:重生者的先知先觉" },
    41: { event: "解石", time: "入学后三月", detail: "方源购买6块紫金石，当众解开5块皆空，展现新手形象", keyInfo: "伪装:扮猪吃虎的铺垫" },
    42: { event: "竟然真的开出了蛊？！", time: "入学后三月", detail: "第5块石头开出二转癞土蛤蟆。贾金生欲低价强买，方源当众高价卖给他（500元石），大赚一笔", keyInfo: "交易:获得第一桶金(500元石)" },
    43: { event: "最后的第六块紫金石", time: "入学后三月", detail: "方源用酒虫+酒将真元提炼至一转中阶。私下解开第6块石头（空的），保留石粉作为掩饰酒虫来源的后手", keyInfo: "智谋:制造不在场证据/借口" },
    44: { event: "猴儿酒，酒虫机缘不相让", time: "入学后三月", detail: "方源买酒时故意向伙计暴露酒虫，拒绝出售，为酒虫的合理来历做铺垫。贾金生陷入假蛊纠纷", keyInfo: "布局:铺垫酒虫来历" },
    45: { event: "洞心机，已在瓮中不自觉", time: "入学后三月", detail: "贾富解决纠纷。方源看穿贾家兄弟内斗，利用此点接近醉酒的贾金生，提出2000元石贩卖花酒行者影壁的秘密", keyInfo: "算计:利用人性贪欲" },
    46: { event: "杀人不要想太多", time: "入学后四月", detail: "带贾金生至秘洞。影壁突变，显示花酒行者要传人屠灭古月一族。贾金生欲杀方源灭口独吞传承，反被方源瞬杀", keyInfo: "杀伐:杀伐果断，瞬杀贾金生 花酒行者密洞是禁地" },
    47: { event: "贾金生，其实我不想杀你的", time: "入学后四月", detail: "大雨洗刷罪证。方源毁尸灭迹，虽然可惜失去贾金生这个棋子，但毫不后悔", keyInfo: "心理:魔头心态，唯利是图" },
    48: { event: "有些可爱", time: "入学后四月", detail: "学堂实战，方源连胜33场（因没体力了）主动下场，打破教头想借他力竭树立典型的计划", keyInfo: "反骨:不按套路出牌" },
    49: { event: "不愁方源脱离掌控", time: "入学后四月", detail: "只要还是学员，就在掌握中。家老决定利用方正等人率先晋升中阶来打压方源的嚣张气焰", keyInfo: "高层视角:磨刀石理论" },
    50: { event: "中阶!", time: "五月后", detail: "方正等人还在努力，方源凭借酒虫和熬夜苦修，抢先一步晋升一转中阶", keyInfo: "突破:同届第一中阶" },
    51: { event: "倒要看看你怎么解释", time: "五月后", detail: "方源旷课。家老派侍卫捉拿。方源将侍卫打残，拖着血淋淋的侍卫到学堂，反咬一口侍卫干扰他突破", keyInfo: "借势:恶人先告状" },
    52: { event: "我的解释你只能接受", time: "五月后", detail: "方源展示中阶修为。家老为了维护奖掖后进的公正形象，被迫接受方源的解释，不但不罚反而表扬", keyInfo: "博弈:以大义压人" },
    53: { event: "方源就任命你为班头", time: "五月后", detail: "家老任命方源为班头（享补贴）。方源竟当众拒绝，震惊全场", keyInfo: "惊人之举:拒绝体制招揽" },
    54: { event: "我可是班头啊！", time: "五月后", detail: "漠北顺位成为班头，赤城、方正为副班头。漠北想对方源摆谱，被方源暴打。方源将班头保护费涨价至8块", keyInfo: "霸道:规矩我来定" },
    55: { event: "要的就是你这番话", time: "五月后", detail: "贾富为寻弟归来。方源被带去对质，被赌场女和酒铺伙计指认", keyInfo: "危机:贾富兴师问罪" },
    56: { event: "洗尽嫌疑", time: "五月后", detail: "方源承认买石得酒虫（谎称第6块开出），承认见过贾金生但因拒卖酒虫而分道扬镳。巧妙引导众人怀疑贾家内斗（贾贵）", keyInfo: "话术:祸水东引" },
    57: { event: "君子的谎言", time: "五月后", detail: "贾富欲抓方源顶罪。家老力保方源。贾富动用竹君子（测谎蛊，需至诚君子）。方源用春秋蝉气息压制竹君子令其失效，成功通过测谎", keyInfo: "外挂:春秋蝉压制四转蛊" },
    58: { event: "家族里不是只有规矩", time: "五月后", detail: "古月博用人祖故事点拨学堂家老：规矩是死的，人情是活的。不要逼反方源，要容忍这块磨刀石", keyInfo: "政治:族长的御下之道" },
    59: { event: "不管三转四转，都是猴子", time: "五月后", detail: "贾富离去，去寻贾贵晦气。方源笑看众生如猴子捞月，自比真月", keyInfo: "境界:超脱的眼界" },
    60: { event: "影灭壁破现甬道", time: "半年后", detail: "风波平息后，方源重返秘洞。磨穿影壁，发现通往地下的甬道。谨防陷阱，投石探路后暂未深入", keyInfo: "进展:开启传承甬道" },
    61: { event: "草绳上的人生", time: "半年后", detail: "方源用兔子探路确认甬道安全，尽头被巨石堵死。他在洞中搓草绳感悟人生：经年累月的纠缠与打磨", keyInfo: "感悟:人生如搓绳" },
    62: { event: "蛊室再选蛊", time: "半年后", detail: "学堂选第二只蛊。方源因无合适蛊虫（想要白/黑豕蛊），选取小光蛊（增幅月刃）", keyInfo: "选择:确立流派雏形" },
    63: { event: "月下赠玉皮，地花藏白豕", time: "半年后", detail: "族长私下赐方正珍稀玉皮蛊，激励他超越方源。方源推测巨石关卡意图，在甬道挖掘出地藏花，得白豕蛊（增加气力）", keyInfo: "机缘:获得白豕蛊" },
    64: { event: "暗事好做，明事难成", time: "半年后", detail: "方源计划猎杀野猪喂养白豕蛊，并通过卖肉缓解经济压力。感叹借助传承暗中积蓄实力的重要性", keyInfo: "规划:经济与修行的平衡" },
    65: { event: "还不快滚", time: "半年后", detail: "方源在村落附近寻找野猪，发现一头落入陷阱的野猪。猎户头领王二带人出现，喝令方源滚", keyInfo: "冲突:凡人猎户的挑衅" },
    66: { event: "人死如猪死", time: "半年后", detail: "王二不论身份直接动手，方源反击。借阳光晃眼，方源月刃瞬杀王二及另一猎户。感叹人死如猪，众生平等", keyInfo: "杀伐:视凡人如草芥" },
    67: { event: "你放心，我会饶了你们的", time: "半年后", detail: "方源闯入王二家，用月刃威逼其父王老汉画出陷阱分布图。王老汉为保女求饶，画下图纸", keyInfo: "手段:斩草除根的铺垫" },
    68: { event: "大自然没有无辜", time: "半年后", detail: "确认图纸后，方源违背诺言，杀王老汉及其女灭口。搜出藏在木炭中的真·兽皮地图（含红叉禁地与红圈标记）", keyInfo: "狠辣:灭门夺图 山中有危险" },
    69: { event: "命贱如草", time: "半年后", detail: "驻村蛊师江鹤出现，不仅不追究方源杀人，反因方源也是蛊师而在此事上与其同流合污，甚至帮忙掩盖", keyInfo: "社会:蛊师阶级的共犯结构" },
    70: { event: "使用白豕蛊", time: "半年后", detail: "方源利用小光蛊增幅月刃（体型威力倍增）轻松猎杀野猪。开始使用白豕蛊改造身体，剧痛难忍但坚持", keyInfo: "修行:忍受剧痛换取力量" },
    71: { event: "力可扛猪思低调", time: "半年后", detail: "力量大增，可扛起野猪。推巨石仍不动。方源决定在年中考核（猎猪）中低调行事，改变反骨形象", keyInfo: "策略:韬光养晦" },
    72: { event: "任何组织都需要忠诚", time: "半年后", detail: "考核前夕，家族氛围强调忠诚。方源意识到自己形象过于桀骜，决定利用考核机会缓和与体制的关系", keyInfo: "政治:形象工程" },
    73: { event: "神秘的红圈标记", time: "半年后", detail: "考核开始。方源猎杀效率极高。趁机探索地图红圈处，发现树屋中有自己的画像和匕首（复仇标记）", keyInfo: "危机:魔道复仇者现身" },
    74: { event: "智窥迷雾现杀机", time: "半年后", detail: "方源推断出真相：王二之兄王大未死，且是二转魔道蛊师。红圈是其藏身处。王大欲杀方源报仇", keyInfo: "推理:还原真相" },
    75: { event: "魔道的觉悟！", time: "半年后", detail: "方源意识到王大就在附近，觉悟杀人者人恒杀之。试图反其道而行避开王大。王大用幽影随行蛊潜入，连杀监考蛊师", keyInfo: "觉悟:生死看淡" },
    76: { event: "后悔吗", time: "半年后", detail: "王大追上方源。多位家老现身围剿。王大临死反扑欲杀方源，方正用玉皮蛊挡下致命一击。王大含恨而终，魔道悲歌", keyInfo: "激战:魔道之死，方正挡刀" },
    78: { event: "不出算计收获丰", time: "年末前", detail: "族长误以为方源被某派系招揽（因其表现出的懂事），决定也通过奖励方源来制衡。方源借此获得保护伞，并贿赂江鹤封口", keyInfo: "获利:借势上位" },
    79: { event: "突破遗藏第六蛊", time: "年末前", detail: "秋季已至，方源白豕蛊练至极限（一猪之力）。重推甬道圆石，成功推开五十步以上，打通关卡", keyInfo: "进展:力量传承新阶段" },
    80: { event: "战力大涨", time: "年末前", detail: "方源凭巨力+玉皮蛊，肉搏碾压野猪。探索石林（传承下一关），遭遇被神秘生物秒杀的老狼", keyInfo: "实力:肉搏野猪" },
    81: { event: "二转初阶！", time: "年末前", detail: "方正率先晋升二转初阶，全场震惊。方源凭借酒虫被认为是运气好。方正则被视为家族希望", keyInfo: "境界:方正晋升二转" },
    82: { event: "年末考核开始", time: "年末", detail: "年末考核拉开序幕。各大家老和精英小组组长（青书、赤山、漠颜）观战选人", keyInfo: "过渡:考核开幕" },
    83: { event: "扫强敌方正展风采", time: "年末考核", detail: "方正连续击败漠北（利用射程优势）和赤城（利用心理战），展现出二转的压倒性实力", keyInfo: "战绩:方正连胜" },
    84: { event: "狠狠地踩踏！", time: "年末考核", detail: "兄弟对决。方源利用五百年战斗经验，看穿方正所有动作，近身肉搏将其打倒。方正试图反击被射穿手掌", keyInfo: "碾压:经验vs修为" },
    85: { event: "热血和冷血！！", time: "年末考核", detail: "方正在声援中爆发，开启玉皮蛊防御。方源依靠白豕蛊巨力，徒手轰碎玉皮防御，彻底击昏方正", keyInfo: "实力:徒手破玉皮" },
    86: { event: "怀疑和试探", time: "年末考核后", detail: "学堂家老检查方源伤势，未发现破绽。方源夺得第一。高层怀疑方源有神秘背景（因其怪力）", keyInfo: "结果:方源夺冠" },
    87: { event: "态度就是心的面具", time: "年末考核后", detail: "族长试探方源，逼其站队。方源出人意料选择加入边缘人物古月角三（病蛇）的小组，避开派系斗争", keyInfo: "抉择:加入病蛇组" },
    88: { event: "下马威、刁难和打压", time: "次年初", detail: "角三小组给方源下马威（雪地奔袭）和刁难（独自分配采集任务）。方源凭借经验完美完成", keyInfo: "职场:应对刁难" },
    89: { event: "一条病蛇盘踞在脚边", time: "次年初", detail: "角三表面温和实则阴险，试图逼迫方源租住特定房屋（监视）。方源识破，坚持租住前世破屋", keyInfo: "阴谋:监视与控制" },
    90: { event: "不过是些许风霜罢了", time: "次年初", detail: "方源推断出角三受舅父指使，意图拖延他晋升二转以阻挠分家产。方源决定利用元石强行冲关", keyInfo: "决心:强行冲关" },
    91: { event: "方源，我们很担心你", time: "次年初", detail: "方源闭锁房门冲击二转。角三等人找不到人，焦急搜寻", keyInfo: "闭关:争分夺秒" },
    92: { event: "未来遥遥在望", time: "次年初", detail: "角三破门而入扑空。方源躲在江鹤村庄，成功晋升二转初阶（赤铁真元）", keyInfo: "晋升:二转达成" },
    93: { event: "小兽潮", time: "次年初", detail: "回寨途中遭遇小兽潮（狼潮前奏）。方源被迫加入古月赤山小组临时行动，见识精英实力", keyInfo: "危机:小兽潮爆发" },
    94: { event: "忽然收力", time: "次年初", detail: "偶遇被野猪王困住的角三组。方源被派协助。角三让队员华欣施蛊控制野猪，方源趁机松手", keyInfo: "借刀:算计队友 兽潮期间山林极度危险" },
    95: { event: "猪的队友", time: "次年初", detail: "野猪王发狂杀死华欣。方源伪装受伤。电狼群突袭，角三小组溃逃", keyInfo: "团灭:借兽杀人" },
    96: { event: "为了死去的人", time: "次年初", detail: "方源打晕意图抢位的女队友做挡箭牌，藏身猪腹幸存。事后用血衣闷死重伤的角三，假意悲痛", keyInfo: "狠辣:斩草除根" },
    97: { event: "魔头横行", time: "次年初", detail: "方源接受审查，冷静应对洗脱嫌疑。虽背负贪生怕死、不顾同伴的恶名，但获实利", keyInfo: "名声:魔头本色" },
    98: { event: "炼蛊的艰难", time: "次年初", detail: "舅父贿赂内务堂，给方源安排极难的分家任务：采集金斑蜜酒。方源筹备合炼白玉蛊", keyInfo: "任务:刁难升级" },
    99: { event: "是人不是神", time: "次年初", detail: "方源利用前世秘方（添加野猪王雪獠牙），成功将白豕蛊和玉皮蛊合炼成白玉蛊", keyInfo: "合炼:白玉蛊（二转防御）" },
    100: { event: "此消彼长", time: "次年春", detail: "方源利用白玉蛊和之前的布局，在家族政治中站稳脚跟，巩固自身地位", keyInfo: "局势:站稳脚跟" },
    101: { event: "狡诈狠毒", time: "次年春", detail: "方源利用小型兽潮引发的混乱，借刀杀人，团灭病蛇（古月角三）小组，清除异己", keyInfo: "狠辣:团灭病蛇" },
    102: { event: "九叶生机草", time: "次年春", detail: "方源作为唯一幸存者归来，成功继承双亲遗产（酒肆、竹楼、九叶生机草）", keyInfo: "遗产:九叶生机草" },
    103: { event: "家族的妥协", time: "次年春", detail: "家族高层由于需要方源的力量（或平衡派系），默许了方源的继承行为", keyInfo: "妥协:家族默许" },
    104: { event: "元石与初阶", time: "次年春", detail: "方源掌控遗产，手里有了大量元石资源，为修炼提供坚实保障", keyInfo: "资源:掌控遗产" },
    105: { event: "经营", time: "次年春", detail: "方源开始贩卖生机叶（治疗用），通过经营获得持续且丰厚的元石收入", keyInfo: "经营:贩卖生机叶" },
    106: { event: "你要购买它？", time: "次年春", detail: "古月青书代表家族（或个人意愿）意图购买方源手中的酒虫", keyInfo: "交锋:青书买蛊" },
    107: { event: "你要和我斗蛊吗？", time: "次年春", detail: "方源利用方正的身世秘密威胁青书，迫使青书放弃购买", keyInfo: "威胁:抓住软肋" },
    108: { event: "舅父的再次出手", time: "次年春", detail: "舅父古月冻土不甘心失败，指使大力士古月蛮石去方源酒肆闹事，意图打压", keyInfo: "刁难:蛮石闹事" },
    109: { event: "树屋藏酒虫", time: "次年春", detail: "商队提前到来（春季）。方源在酒肆当众击败蛮石（使用月芒蛊），一战扬名", keyInfo: "扬名:击败蛮石" },
    110: { event: "老太婆，你太嫩了", time: "次年春", detail: "争夺树屋中的酒虫。方源与药堂家老古月药姬竞价，利用心理战术", keyInfo: "竞价:争夺酒虫" },
    111: { event: "元石不过身外物", time: "次年春", detail: "方源成功拍下酒虫（第二只），并购买黑豕蛊（增加力量，可与白豕蛊叠加）", keyInfo: "收获:酒虫+黑豕蛊" },
    112: { event: "真是好魄力", time: "次年春", detail: "为筹集购买舍利蛊的资金，方源果断将酒肆和竹楼卖回给舅父，获取大量现银", keyInfo: "魄力:变卖资产" },
    113: { event: "闷声发财", time: "次年春", detail: "方源买下赤铁舍利蛊。贾富试图招揽方源，赠予令牌，并提及神捕铁血冷即将到来", keyInfo: "伏笔:铁血冷" },
    114: { event: "洞中有猴王", time: "次年夏", detail: "方源入石林修炼，发现玉眼石猴王（百兽王，拥有隐身蛊）", keyInfo: "探索:发现猴王" },
    115: { event: "晋升中阶", time: "次年夏", detail: "方源使用赤铁舍利蛊，瞬间晋升二转中阶", keyInfo: "晋升:二转中阶" },
    116: { event: "斩杀猴王得新蛊", time: "次年夏", detail: "方源利用衣物诱敌，击杀隐身猴王，获得隐石蛊。发现石林地下洞穴入口", keyInfo: "斩杀:获隐石蛊" },
    117: { event: "苦贝酒和吞江蟾", time: "次年夏", detail: "方源寻找合炼酒虫的苦酒。一只五转吞江蟾堵塞河道，如睡着的小山，引发恐慌", keyInfo: "危机:吞江蟾现身" },
    118: { event: "吞江蟾的传说", time: "次年夏", detail: "讲述吞江蟾与传奇人物江凡的故事。吞江蟾性情温和但实力恐怖", keyInfo: "传说:江凡" },
    119: { event: "此子顽劣", time: "次年夏", detail: "家族试图推醒吞江蟾。赤山失败，推荐力大的方源。高层强令方源执行任务", keyInfo: "任务:强推吞江蟾" }
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


            console.log('[宿命蛊] 提取的JSON:', jsonMatch[0].substring(0, 500));

            const result = JSON.parse(jsonMatch[0]);

            console.log('[宿命蛊] ========== 完整解析结果 ==========');
            console.log('[宿命蛊] 解析结果:', JSON.stringify(result, null, 2));

            // ===== 1. 时间和章节 =====
            ws.time = result.time || ws.time;
            ws.chapter = (result.chapter !== undefined && result.chapter > ws.chapter) ? result.chapter : ws.chapter + 1;
            console.log('[宿命蛊] 时间:', ws.time, '章节:', ws.chapter);

            // ===== 2. 方源状态 - 兼容多种格式 =====
            if (result.fangYuan && typeof result.fangYuan === 'object') {
                ws.fangYuan.location = result.fangYuan.location || ws.fangYuan.location;
                ws.fangYuan.action = result.fangYuan.action || ws.fangYuan.action;
            } else if (result.fangYuanLocation || result.fangYuanAction) {
                ws.fangYuan.location = result.fangYuanLocation || ws.fangYuan.location;
                ws.fangYuan.action = result.fangYuanAction || ws.fangYuan.action;
            }
            console.log('[宿命蛊] 方源:', ws.fangYuan);

            // ===== 3. NPC状态 - 深度合并 =====
            if (result.npcs && typeof result.npcs === 'object') {
                for (const [npcName, npcData] of Object.entries(result.npcs)) {
                    if (!ws.npcs[npcName]) {
                        ws.npcs[npcName] = { status: '未知', plan: '未知' };
                    }
                    if (typeof npcData === 'object') {
                        ws.npcs[npcName].status = npcData.status || ws.npcs[npcName].status;
                        ws.npcs[npcName].plan = npcData.plan || ws.npcs[npcName].plan;
                    } else if (typeof npcData === 'string') {
                        ws.npcs[npcName].status = npcData;
                    }
                }
            }
            console.log('[宿命蛊] NPC状态:', ws.npcs);

            // ===== 4. 地点状态 - 深度合并 =====
            if (result.locations && typeof result.locations === 'object') {
                for (const [locName, locStatus] of Object.entries(result.locations)) {
                    ws.locations[locName] = locStatus;
                }
            }
            console.log('[宿命蛊] 地点状态:', ws.locations);

            // ===== 5. 玩家状态 =====
            if (result.player && typeof result.player === 'object') {
                ws.player.cultivation = result.player.cultivation || ws.player.cultivation;
                ws.player.money = (result.player.money !== undefined && result.player.money !== null) ? result.player.money : ws.player.money;
                ws.player.gu = Array.isArray(result.player.gu) ? result.player.gu : ws.player.gu;
                ws.player.location = result.player.location || ws.player.location;
            }
            console.log('[宿命蛊] 玩家状态:', ws.player);

            // ===== 6. 世界动态 =====
            ws.currentEvent = result.currentEvent || ws.currentEvent;
            ws.nextEvent = result.nextEvent || ws.nextEvent;
            ws.worldDynamic = result.worldDynamic || ws.worldDynamic;
            console.log('[宿命蛊] 世界动态:', ws.worldDynamic);
            console.log('[宿命蛊] 即将发生:', ws.nextEvent);

            // ===== 7. 危险评估 =====
            ws.danger = result.danger || '安全';
            ws.dangerSource = result.dangerSource || null;
            console.log('[宿命蛊] 危险:', ws.danger, '来源:', ws.dangerSource);

            // ===== 8. 死亡判定 =====
            if (result.isDead === true) {
                ws.isDead = true;
                ws.deathReason = result.deathReason || '未知原因';
                console.log('[宿命蛊] !!!!! 死亡判定 !!!!!', ws.deathReason);
                await handleDeath(ws.deathReason);
            } else {
                console.log('[宿命蛊] ========== 写入世界书 ==========');
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

        // 调试：打印即将写入的内容
        console.log('[宿命蛊] ===== 即将写入世界书 =====');
        console.log('[宿命蛊] 写入方源:', ws.fangYuan);
        console.log('[宿命蛊] 写入NPC:', JSON.stringify(ws.npcs));
        console.log('[宿命蛊] 写入内容长度:', content.length);
        console.log('[宿命蛊] 写入内容预览:', content.substring(0, 500));

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

    // 始终监听消息事件，在回调中检查设置
    eventSource.on(event_types.MESSAGE_RECEIVED, async () => {
        const currentSettings = extension_settings[extensionName];
        console.log('[宿命蛊] MESSAGE_RECEIVED事件触发', { enabled: currentSettings.enabled, triggerMode: currentSettings.triggerMode });

        if (currentSettings.enabled && currentSettings.triggerMode === 'auto') {
            console.log('[宿命蛊] 自动触发世界更新');
            await updateWorldState();
        }
    });

    console.log('[宿命蛊] 扩展已加载 v2.1 - 自动触发已修复');
});
