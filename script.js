    async function updateBatteryStatus() {
        // 首先检查浏览器是否支持电池API
        if ('getBattery' in navigator) {
            try {
                // 异步获取电池状态管理器
                const battery = await navigator.getBattery();        // 获取相关的HTML元素
            const batteryLevelText = document.getElementById('battery-level');
            const batteryFillRect = document.getElementById('battery-fill-rect');
    
            // 创建一个内部函数，用于更新显示
            const updateDisplay = () => {
                if (!batteryLevelText || !batteryFillRect) return;
    
                // 计算电量百分比
                const level = Math.floor(battery.level * 100);
                batteryLevelText.textContent = `${level}%`;
    
                // 根据电量更新SVG内部填充条的宽度
                // SVG内部填充区域总宽度是18，所以用电量百分比去乘以它
                batteryFillRect.setAttribute('width', 18 * battery.level);
    
                // 根据电量和充电状态改变颜色，更有细节感
                let fillColor = "#666"; // 默认颜色
                if (battery.charging) {
                    fillColor = "#4CAF50"; // 充电时显示绿色
                } else if (level <= 20) {
                    fillColor = "#f44336"; // 低电量时显示红色
                }
                batteryFillRect.setAttribute('fill', fillColor);
            };
    
            // 第一次加载时，立即更新一次
            updateDisplay();
    
            // 添加事件监听器，当电量变化或充电状态变化时，自动更新
            battery.addEventListener('levelchange', updateDisplay);
            battery.addEventListener('chargingchange', updateDisplay);
    
        } catch (error) {
            console.error('无法获取电池信息:', error);
            // 如果获取失败，就隐藏电池小部件
            const batteryWidget = document.querySelector('.widget-battery');
            if (batteryWidget) batteryWidget.style.display = 'none';
        }
    } else {
        console.log('您的浏览器不支持电池状态API。');
        // 如果浏览器不支持，也隐藏电池小部件
        const batteryWidget = document.querySelector('.widget-battery');
        if (batteryWidget) batteryWidget.style.display = 'none';
    }
    }
    
    
    // gemini如果是多个密钥, 那么随机获取一个
    function getRandomValue(str) {
        // 检查字符串是否包含逗号
        if (str.includes(',')) {
            // 用逗号分隔字符串并移除多余空格
            const arr = str.split(',').map(item => item.trim());
            // 生成随机索引 (0 到 arr.length-1)
            const randomIndex = Math.floor(Math.random() * arr.length);
            // 返回随机元素
            return arr[randomIndex];
        }
        // 没有逗号则直接返回原字符串
        return str;
    }

    document.addEventListener('DOMContentLoaded', () => {
        async function compressImage(file, options = {}) {
            const {
                quality = 0.8, maxWidth = 800, maxHeight = 800
            } = options;

            // --- 新增：处理GIF动图 ---
            // 如果文件是GIF，则不经过canvas压缩，直接返回原始文件数据以保留动画
            if (file.type === 'image/gif') {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = error => reject(error);
                });
            }

            // --- 对其他静态图片（如PNG, JPG）进行压缩 ---
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onerror = reject;
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onerror = reject;
                    img.onload = () => {
                        let width = img.width;
                        let height = img.height;

                        if (width > height) {
                            if (width > maxWidth) {
                                height = Math.round(height * (maxWidth / width));
                                width = maxWidth;
                            }
                        } else {
                            if (height > maxHeight) {
                                width = Math.round(width * (maxHeight / height));
                                height = maxHeight;
                            }
                        }

                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');

                        // 对于有透明背景的PNG图片，先填充一个白色背景
                        // 这样可以防止透明区域在转换成JPEG时变黑
                        if (file.type === 'image/png') {
                            ctx.fillStyle = '#FFFFFF'; // 白色背景
                            ctx.fillRect(0, 0, width, height);
                        }

                        ctx.drawImage(img, 0, 0, width, height);

                        // --- 关键修正：将输出格式改为 'image/jpeg' ---
                        // JPEG格式可以显著减小文件大小，避免浏览器处理超大Base64字符串时崩溃
                        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(compressedDataUrl);
                    };
                };
            });
        }

        // --- Initial HTML Injection ---
        document.getElementById('api-settings-screen').innerHTML = `<header class="app-header"><button class="back-btn" data-target="home-screen">‹</button><div class="title-container"><h1 class="title">API 设置</h1></div><div class="placeholder"></div></header><main class="content"><form id="api-form">
        <div class="form-group">
            <label for="api-preset-select">API预设</label>
            <div style="display:flex;align-items:center;gap:10px;">
                <select id="api-preset-select" style="flex:1;min-width:120px;padding:12px;border-radius:10px;border:2px solid #fce4ec;background-color:#fff;">
                    <option value="">— 选择预设 —</option>
                </select>
                <button type="button" id="api-save-preset" class="btn btn-secondary" style="flex-shrink:0;white-space:nowrap;min-width:auto;width:auto;margin:0;">另存</button>
                <button type="button" id="api-manage-presets" class="btn btn-neutral" style="flex-shrink:0;white-space:nowrap;min-width:auto;width:auto;margin:0;">管理</button>
            </div>
        </div>
            <div id="api-presets-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:9999;align-items:center;justify-content:center;">
                <div style="width:640px;max-width:94%;background:var(--panel-bg,#fff);padding:16px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.12);">
                    <h3 style="margin:0 0 12px 0;">API 预设管理</h3>
                    <div id="api-presets-list" style="max-height:360px;overflow:auto;border:1px solid #f0f0f0;padding:8px;border-radius:6px;"></div>
                    <div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">
                        <button id="api-close-modal" class="btn btn-primary">关闭</button>
                    </div>
                </div>
            </div>
        </div><div class="form-group"><label for="api-provider">API 服务商</label><select id="api-provider" name="provider"><option value="newapi">NewAPI (自定义)</option><option value="deepseek">DeepSeek</option><option value="claude">Claude</option><option value="gemini">Gemini</option></select></div><div class="form-group"><label for="api-url">API 地址（后缀不用添加/v1）</label><input type="url" id="api-url" name="url" placeholder="选择服务商可自动填写" required></div><div class="form-group"><label for="api-key">密钥 (Key)</label><input type="password" id="api-key" name="key" placeholder="请输入你的API密钥" required></div><button type="button" class="btn btn-secondary" id="fetch-models-btn"><span class="btn-text">点击拉取模型</span><div class="spinner"></div></button><div class="form-group"><label for="api-model">选择模型</label><select id="api-model" name="model" required><option value="">请先拉取模型列表</option></select></div><div class="form-group" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #fce4ec; border-radius: 10px; background-color: #fff8fa;">
    <label for="time-perception-switch" style="margin-bottom: 0; color: var(--secondary-color); font-weight: 600;">时间感知加强</label>
    <input type="checkbox" id="time-perception-switch" style="width: auto; height: 20px; width: 20px;">
</div>
<hr style="margin:20px 0; opacity:.3">
<div class="form-group" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
    <div style="flex-grow: 1;">
        <label for="novelai-switch" style="margin-bottom: 0; display: block; color: var(--secondary-color); font-weight: 600;">
            启用 NovelAI 图像生成
        </label>
        <p style="font-size: 13px; font-weight: normal; color: #666; margin-top: 8px; margin-bottom: 5px; line-height: 1.5;">
            开启后可使用NovelAI官方API生成高质量动漫风格图像（必开🔮）
        </p>
        <p style="font-size: 13px; font-weight: normal; color: #666; margin-top: 8px; margin-bottom: 5px; line-height: 1.5;">
            1. 三击下载图片，下面可测试模型或关键词画师串
        </p>
        <p style="font-size: 13px; font-weight: normal; color: #666; margin-top: 8px; margin-bottom: 5px; line-height: 1.5;">
            2. 429是novel的访问频繁错误，等待几秒重新即可
        </p>
        <p style="font-size: 13px; font-weight: normal; color: #666; margin-top: 8px; margin-bottom: 5px; line-height: 1.5;">
            3. 403是多人共号限制，限制oplus免费出小图但可扣点数
        </p>
        <p style="font-size: 13px; font-weight: normal; color: #666; margin-top: 8px; margin-bottom: 5px; line-height: 1.5;">
            4. 403也会因为没开🔮报错，实在不行可更换出图尺寸
        </p>
        <p style="font-size: 13px; font-weight: normal; color: #666; margin-top: 8px; margin-bottom: 0; line-height: 1.5;">
            5. 401是key没权限，检查key是否正确
        </p>
    </div>
    <label class="toggle-switch" style="margin-top: 5px;">
        <input type="checkbox" id="novelai-switch">
        <span class="slider"></span>
    </label>
</div>

<div id="novelai-details" style="display: none;">
    <div class="form-group">
        <label for="novelai-model">NovelAI 模型</label>
        <select id="novelai-model" name="novelai_model" class="form-group">
            <option value="nai-diffusion-4-curated-preview">NAI Diffusion V4.5 Curated (精选版无nsfw)</option>
            <option value="nai-diffusion-4-5-full">NAI Diffusion V4.5 Full（完整版含nsfw）</option>
            <option value="nai-diffusion-3">NAI Diffusion Anime V3（旧版）</option>
            <option value="nai-diffusion-furry-3">NAI Diffusion Furry V3（旧旧版）</option>
        </select>
        <p style="font-size: 13px; color: #666; margin-top: 8px; line-height: 1.5;">
            💡 必须有oplus订阅的apikey才可以使用！
        </p>
    </div>

    <div class="form-group">
        <label for="novelai-api-key">NovelAI API Key</label>
        <div class="form-group" style="position: relative; margin-bottom: 0;">
            <input type="password" id="novelai-api-key" name="novelai_api_key" placeholder="pst-xxxxxxxxxxxxxxxx" style="padding-right: 40px;">
            <span id="novelai-key-toggle">🧐</span>
        </div>
        <p style="font-size: 13px; color: #666; margin-top: 8px; line-height: 1.5;">
            💡 在 <a href="https://novelai.net" target="_blank" style="color: var(--primary-color);">NovelAI官网</a> 获取API Key
        </p>
    </div>

    <div style="display: flex; gap: 10px; margin-top: 15px; align-items: flex-end; margin-bottom: 15px;">
        <button type="button" id="novelai-settings-btn" class="btn btn-neutral" style="flex: 1; height: 44px; display: flex; align-items: center; justify-content: center; margin-bottom: 0;">
            ⚙️ 生成设置
        </button>
        <button type="button" id="novelai-test-btn" class="btn btn-secondary" style="flex: 1; height: 44px; display: flex; align-items: center; justify-content: center; margin-bottom: 0;">
            🧪 测试生成
        </button>
    </div>
</div>
<button type="submit" class="btn btn-primary" id="save-btn"><span class="btn-text">保 存</span><div class="spinner"></div></button></form></main>`;
             document.getElementById('font-settings-screen').innerHTML = `<header class="app-header"><button class="back-btn" data-target="home-screen">‹</button><div class="title-container"><h1 class="title">字体设置</h1></div><div class="placeholder"></div></header><main class="content"><form id="font-settings-form"><div class="form-group"><label for="font-preset-select">字体预设</label><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;"><select id="font-preset-select" style="flex:1;min-width:120px;padding:12px;border-radius:10px;border:2px solid #fce4ec;background-color:#fff;"><option value="">— 选择预设 —</option></select><button type="button" id="font-save-preset" class="btn btn-secondary" style="flex-shrink:0;white-space:nowrap;min-width:auto;width:auto;margin:0;">另存</button><button type="button" id="font-manage-presets" class="btn btn-neutral" style="flex-shrink:0;white-space:nowrap;min-width:auto;width:auto;margin:0;">管理</button></div></div><div class="form-group"><label for="font-url">字体链接 (ttf, woff, woff2)</label><input type="url" id="font-url" placeholder="https://.../font.ttf" required></div><button type="submit" class="btn btn-primary" style="margin-bottom: 15px;">保存并应用</button><button type="button" class="btn btn-neutral" id="restore-default-font-btn" style="margin-top: 0;">恢复默认字体</button></form></main>`;
        document.getElementById('customize-screen').innerHTML = `<header class="app-header"><button class="back-btn" data-target="home-screen">‹</button><div class="title-container"><h1 class="title">主屏幕自定义</h1></div><div class="placeholder"></div></header><main class="content"><form id="customize-form"></form></main>`;
        document.getElementById('tutorial-screen').innerHTML = `<header class="app-header"><button class="back-btn" data-target="home-screen">‹</button><div class="title-container"><h1 class="title">教程</h1></div><div class="placeholder"></div></header><main class="content" id="tutorial-content-area"></main>`;

        // --- Global Variables and Constants ---
        const colorThemes = {
            'white_pink': {
                name: '白/粉',
                received: {bg: 'rgba(255,255,255,0.9)', text: '#6D6D6D'},
                sent: {bg: 'rgba(255,204,204,0.9)', text: '#A56767'}
            },
            'white_blue': {
                name: '白/蓝',
                received: {bg: 'rgba(255,255,255,0.9)', text: '#6D6D6D'},
                sent: {bg: 'rgba(173,216,230,0.9)', text: '#4A6F8A'}
            },
            'white_yellow': {
                name: '白/黄',
                received: {bg: 'rgba(255,255,255,0.9)', text: '#6D6D6D'},
                sent: {bg: 'rgba(249,237,105,0.9)', text: '#8B7E4B'}
            },
            'white_green': {
                name: '白/绿',
                received: {bg: 'rgba(255,255,255,0.9)', text: '#6D6D6D'},
                sent: {bg: 'rgba(188,238,188,0.9)', text: '#4F784F'}
            },
            'white_purple': {
                name: '白/紫',
                received: {bg: 'rgba(255,255,255,0.9)', text: '#6D6D6D'},
                sent: {bg: 'rgba(185,190,240,0.9)', text: '#6C5B7B'}
            },
            'black_red': {
                name: '黑/红',
                received: {bg: 'rgba(30,30,30,0.85)', text: '#E0E0E0'},
                sent: {bg: 'rgb(226,62,87,0.9)', text: '#fff'}
            },
            'black_green': {
                name: '黑/绿',
                received: {bg: 'rgba(30,30,30,0.85)', text: '#E0E0E0'},
                sent: {bg: 'rgba(119,221,119,0.9)', text: '#2E5C2E'}
            },
            'black_white': {
                name: '黑/白',
                received: {bg: 'rgba(30,30,30,0.85)', text: '#E0E0E0'},
                sent: {bg: 'rgba(245,245,245,0.9)', text: '#333'}
            },
            'white_black': {
                name: '白/黑',
                received: {bg: 'rgba(255,255,255,0.9)', text: '#6D6D6D'},
                sent: {bg: 'rgba(50,50,50,0.85)', text: '#F5F5F5'}
            },
            'yellow_purple': {
                name: '黄/紫',
                received: {bg: 'rgba(255,250,205,0.9)', text: '#8B7E4B'},
                sent: {bg: 'rgba(185,190,240,0.9)', text: '#6C5B7B'}
            },
            'pink_blue': {
                name: '粉/蓝',
                received: {bg: 'rgba(255,231,240,0.9)', text: '#7C6770'},
                sent: {bg: 'rgba(173,216,230,0.9)', text: '#4A6F8A'}
            },
        };
        const defaultWidgetSettings = {
            centralCircleImage: 'https://i.postimg.cc/mD83gR29/avatar-1.jpg',
            topLeft: { emoji: '🎧', text: '𝑀𝑒𝑚𝑜𝑟𝑖𝑒𝑠✞' },
            topRight: { emoji: '🐈‍⬛', text: '𐙚 ♰.𝐾𝑖𝑡𝑡𝑒𝑛.♰' },
            bottomLeft: { emoji: '💿', text: '᪗₊𝔹𝕒𝕓𝕖𝕚𝕤₊' },
            bottomRight: { emoji: '🥛', text: '.☘︎ ˖+×+.' }
        };
               const defaultIcons = {
            'chat-list-screen': {name: '404', url: 'https://i.postimg.cc/VvQB8dQT/chan-143.png'},
            'api-settings-screen': {name: 'api', url: 'https://i.postimg.cc/50FqT8GL/chan-125.png'},
                        'world-book-screen': {name: '世界书', url: 'https://i.postimg.cc/prCWkrKT/chan-74.png'},
            'peek-select-btn': {name: '查手机', url: 'https://i.postimg.cc/m2DRpk7v/chan-39.png'}, // <-- NEW
            'customize-screen': {name: '自定义', url: 'https://i.postimg.cc/vZVdC7gt/chan-133.png'},
            'font-settings-screen': {name: '字体', url: 'https://i.postimg.cc/FzVtC0x4/chan-21.png'},
            'tutorial-screen': {name: '教程', url: 'https://i.postimg.cc/6QgNzCFf/chan-118.png'},
            'day-mode-btn': {name: '白昼模式', url: 'https://i.postimg.cc/Jz0tYqnT/chan-145.png'},
            'night-mode-btn': {name: '夜间模式', url: 'https://i.postimg.cc/htYvkdQK/chan-146.png'},
            'forum-screen': {name: '论坛', url: 'https://i.postimg.cc/fyPVBZf1/1758451183605.png'},
            'music-screen': {name: '音乐', url: 'https://i.postimg.cc/ydd65txK/1758451018266.png'},
            'diary-screen': {name: '日记本', url: 'https://i.postimg.cc/bJBLzmFH/chan-70.png'},
            'piggy-bank-screen': {name: '存钱罐', url: 'https://i.postimg.cc/3RmWRRtS/chan-18.png'},
            'pomodoro-screen': {name: '番茄钟', url: 'https://i.postimg.cc/PrYGRDPF/chan-76.png'},
            'storage-analysis-screen': {name: '存储分析', url: 'https://i.postimg.cc/J0F3Lt0T/chan-107.png'}
        };


        const peekScreenApps = {
            'messages': { name: '消息', url: 'https://i.postimg.cc/Kvs4tDh5/export202509181826424260.png' },
            'memos': { name: '备忘录', url: 'https://i.postimg.cc/JzD0xH1C/export202509181829064550.png' },
            'cart': { name: '购物车', url: 'https://i.postimg.cc/pLwT6VTh/export202509181830143960.png' },
            'transfer': { name: '中转站', url: 'https://i.postimg.cc/63wQBHCB/export202509181831140230.png' },
            'browser': { name: '浏览器', url: 'https://i.postimg.cc/SKcsF02Z/export202509181830445980.png' },
            'drafts': { name: '草稿箱', url: 'https://i.postimg.cc/ZKqC9D2R/export202509181827225860.png' },
            'album': { name: '相册', url: 'https://i.postimg.cc/qBcdpqNc/export202509221549335970.png' },
            'steps': { name: '步数', url: 'https://i.postimg.cc/5NndFrq6/export202509181824532800.png' },
            'wallet': { name: '钱包', url: 'https://i.postimg.cc/mkZ1hN3r/wallet.png' },
            'unlock': { name: 'unlock！', url: 'https://i.postimg.cc/28zNyYWs/export202509221542593320.png' }
        };

        const simulatedMemos = [];

        const globalSettingKeys = [
            'apiSettings', 'wallpaper', 'homeScreenMode', 'fontUrl', 'customIcons', 'stickerCategories',
            'apiPresets', 'bubbleCssPresets', 'myPersonaPresets', 'globalCss',
            'globalCssPresets', 'homeSignature', 'forumPosts', 'forumBindings', 'pomodoroTasks', 'pomodoroSettings', 'insWidgetSettings', 'homeWidgetSettings',
            'naiGlobalPromptPresets', 'fontPresets' // ▼▼▼ 新增 ▼▼▼
        ];
        const appVersion = "1.2.0"; // Current app version
        const updateLog = [
            {
                version: "1.2.0",
                date: "2025-10-15",
                notes: [
                    "新增：猫箱图床 (Catbox) 渲染机制，在当前绑定的表情包世界书中包含 'catbox' 关键词即可切换到猫箱模式，注意！iposting图床表情包和猫箱表情包不可同时渲染，只能选择一方。如：绑定了猫箱表情包世界书，就无法渲染过往iposting图床的表情包，不绑定则反之。",
                ]
            },
            {
                version: "1.1.0",
                date: "2025-10-13",
                notes: [
                    "重要！！已更换存储方式，请尽快导出原网址的备份并清理浏览器内该网址的数据，并重新在此网址导入备份",
                    "新增：番茄钟，可以创建专注任务并绑定char和自己的人设预设（仅可从预设中选择），在列表中左滑删除任务。专注期间想摸鱼了可以戳一戳头像，ta会对你做出回复。每个专注界面的设置键可以自定义鼓励频率和限制自己戳一戳的次数，超过次数则ta不会再理你，请补药偷懒，努力专注吧！",
                    "新增：两个桌面小组件，现所有小组件都可以通过点击来自定义图片和文字",
                    "优化：修复了存储膨胀的问题，现为测试阶段不确定是否有bug，请勤备份！唯有备份才是安全的！",
                    "优化：修复了一些使用体验上的小问题",
                    "画饼（未来可能会做的）：1.第二页的布局美化 2.日记本、存钱罐、音乐",
                ]
            }
        ];
        let db = {
            characters: [],
            groups: [],
            apiSettings: {},
            wallpaper: 'https://i.postimg.cc/W4Z9R9x4/ins-1.jpg',
            myStickers: [],
            homeScreenMode: 'night',
            worldBooks: [],
            fontUrl: '',
            customIcons: {},
            apiPresets: [],
            bubbleCssPresets: [],
            myPersonaPresets: [],
            forumPosts: [],
            globalCss: '',
            globalCssPresets: [],
            homeSignature: '编辑个性签名...',
            forumBindings: {
                worldBookIds: [],
                charIds: [],
                userPersonaIds: []
            },
            pomodoroTasks: [],
            pomodoroSettings: {
                boundCharId: null,
                userPersona: '',
                focusBackground: '',
                taskCardBackground: '',
                encouragementMinutes: 25,
                pokeLimit: 5,
                globalWorldBookIds: [] // NEW: For global settings
            },
            insWidgetSettings: {
                avatar1: 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg',
                bubble1: 'love u.',
                avatar2: 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg',
                bubble2: 'miss u.'
            },
            // ▼▼▼ 新增：NAI 模块手册 (全局) ▼▼▼
            naiPromptModules: [],
            // ▼▼▼ 新增：NAI 全局提示词预设 ▼▼▼
            naiGlobalPromptPresets: [],
            fontPresets: [], // ▼▼▼ 新增 ▼▼▼
        };
        let currentChatId = null, currentChatType = null, isGenerating = false, longPressTimer = null,
            isInMultiSelectMode = false, editingMessageId = null, currentPage = 1, currentTransferMessageId = null,
            currentEditingWorldBookId = null, currentStickerActionTarget = null,
            currentJournalDetailId = null,
            currentQuoteInfo = null, // 新增：用于存储引用信息
            currentGroupAction = {type: null, recipients: []},
            isWorldBookDeleteConfirming = false; // 防止重复触发删除确认弹窗
        let currentPomodoroTask = null, pomodoroInterval = null, pomodoroRemainingSeconds = 0, pomodoroCurrentSessionSeconds = 0, isPomodoroPaused = true, pomodoroPokeCount = 0, pomodoroIsInterrupted = false, currentPomodoroSettingsContext = null, pomodoroSessionHistory = [];
        let isStickerManageMode = false;
        let selectedStickerIds = new Set();
        let peekContentCache = {};
        let generatingPeekApps = new Set(); // Tracks which apps are currently generating content
        let selectedMessageIds = new Set();
        const MESSAGES_PER_PAGE = 50;
        
        // 世界书多选模式状态
        let isInWorldBookMultiSelectMode = false;
        let selectedWorldBookIds = new Set();

        // --- DOM Element Cache ---
        const screens = document.querySelectorAll('.screen'),
            toastElement = document.getElementById('toast-notification'),
            homeScreen = document.getElementById('home-screen'),
            chatListContainer = document.getElementById('chat-list-container'),
            noChatsPlaceholder = document.getElementById('no-chats-placeholder'),
            addChatBtn = document.getElementById('add-chat-btn'),
            addCharModal = document.getElementById('add-char-modal'),
            addCharForm = document.getElementById('add-char-form'),
            chatRoomScreen = document.getElementById('chat-room-screen'),
            chatRoomHeaderDefault = document.getElementById('chat-room-header-default'),
            chatRoomHeaderSelect = document.getElementById('chat-room-header-select'),
            cancelMultiSelectBtn = document.getElementById('cancel-multi-select-btn'),
            multiSelectTitle = document.getElementById('multi-select-title'),
            chatRoomTitle = document.getElementById('chat-room-title'),
            chatRoomStatusText = document.getElementById('chat-room-status-text'),
            messageArea = document.getElementById('message-area'),
            messageInputDefault = document.getElementById('message-input-default'),
            messageInput = document.getElementById('message-input'),
            sendMessageBtn = document.getElementById('send-message-btn'),
            getReplyBtn = document.getElementById('get-reply-btn'),
            typingIndicator = document.getElementById('typing-indicator'),
            chatSettingsBtn = document.getElementById('chat-settings-btn'),
            settingsSidebar = document.getElementById('chat-settings-sidebar'),
            settingsForm = document.getElementById('chat-settings-form'),
            multiSelectBar = document.getElementById('multi-select-bar'),
            selectCount = document.getElementById('select-count'),
            deleteSelectedBtn = document.getElementById('delete-selected-btn');
        const regenerateBtn = document.getElementById('regenerate-btn'),
            stickerToggleBtn = document.getElementById('sticker-toggle-btn'),
            stickerModal = document.getElementById('sticker-modal'),
            stickerGridContainer = document.getElementById('sticker-grid-container'),
            addNewStickerBtn = document.getElementById('add-new-sticker-btn'),
            addStickerModal = document.getElementById('add-sticker-modal'),
            addStickerModalTitle = document.getElementById('add-sticker-modal-title'),
            addStickerForm = document.getElementById('add-sticker-form'),
            stickerEditIdInput = document.getElementById('sticker-edit-id'),
            stickerPreview = document.getElementById('sticker-preview'),
            stickerNameInput = document.getElementById('sticker-name'),
            stickerUrlInput = document.getElementById('sticker-url-input'),
            stickerFileUpload = document.getElementById('sticker-file-upload');
        const stickerActionSheet = document.getElementById('sticker-actionsheet'),
            editStickerBtn = document.getElementById('edit-sticker-btn'),
            deleteStickerBtn = document.getElementById('delete-sticker-btn');
        const voiceMessageBtn = document.getElementById('voice-message-btn'),
            sendVoiceModal = document.getElementById('send-voice-modal'),
            sendVoiceForm = document.getElementById('send-voice-form'),
            voiceTextInput = document.getElementById('voice-text-input'),
            voiceDurationPreview = document.getElementById('voice-duration-preview');
        const photoVideoBtn = document.getElementById('photo-video-btn'),
            sendPvModal = document.getElementById('send-pv-modal'),
            sendPvForm = document.getElementById('send-pv-form'),
            pvTextInput = document.getElementById('pv-text-input');
        const imageRecognitionBtn = document.getElementById('image-recognition-btn'),
            imageUploadInput = document.getElementById('image-upload-input');
        const walletBtn = document.getElementById('wallet-btn'),
            sendTransferModal = document.getElementById('send-transfer-modal'),
            sendTransferForm = document.getElementById('send-transfer-form'),
            transferAmountInput = document.getElementById('transfer-amount-input'),
            transferRemarkInput = document.getElementById('transfer-remark-input');
        const receiveTransferActionSheet = document.getElementById('receive-transfer-actionsheet'),
            acceptTransferBtn = document.getElementById('accept-transfer-btn'),
            returnTransferBtn = document.getElementById('return-transfer-btn');
        const giftBtn = document.getElementById('gift-btn'), sendGiftModal = document.getElementById('send-gift-modal'),
            sendGiftForm = document.getElementById('send-gift-form'),
            giftDescriptionInput = document.getElementById('gift-description-input');
        const timeSkipBtn = document.getElementById('time-skip-btn'),
            timeSkipModal = document.getElementById('time-skip-modal'),
            timeSkipForm = document.getElementById('time-skip-form'),
            timeSkipInput = document.getElementById('time-skip-input');
        const clearChatHistoryBtn = document.getElementById('clear-chat-history-btn');
        const worldBookListContainer = document.getElementById('world-book-list-container'),
            noWorldBooksPlaceholder = document.getElementById('no-world-books-placeholder'),
            addWorldBookBtn = document.getElementById('add-world-book-btn'),
            editWorldBookScreen = document.getElementById('edit-world-book-screen'),
            editWorldBookForm = document.getElementById('edit-world-book-form'),
            worldBookIdInput = document.getElementById('world-book-id'),
            worldBookNameInput = document.getElementById('world-book-name'),
            worldBookContentInput = document.getElementById('world-book-content');
        const linkWorldBookBtn = document.getElementById('link-world-book-btn'),
            worldBookSelectionModal = document.getElementById('world-book-selection-modal'),
            worldBookSelectionList = document.getElementById('world-book-selection-list'),
            saveWorldBookSelectionBtn = document.getElementById('save-world-book-selection-btn');
        const fontSettingsForm = document.getElementById('font-settings-form'),
            fontUrlInput = document.getElementById('font-url'),
            restoreDefaultFontBtn = document.getElementById('restore-default-font-btn');
        const createGroupBtn = document.getElementById('create-group-btn'),
            createGroupModal = document.getElementById('create-group-modal'),
            createGroupForm = document.getElementById('create-group-form'),
            memberSelectionList = document.getElementById('member-selection-list'),
            groupNameInput = document.getElementById('group-name-input'),
            groupSettingsSidebar = document.getElementById('group-settings-sidebar'),
            groupSettingsForm = document.getElementById('group-settings-form'),
            groupMembersListContainer = document.getElementById('group-members-list-container'),
            editGroupMemberModal = document.getElementById('edit-group-member-modal'),
            editGroupMemberForm = document.getElementById('edit-group-member-form');
        const addMemberActionSheet = document.getElementById('add-member-actionsheet'),
            inviteExistingMemberBtn = document.getElementById('invite-existing-member-btn'),
            createNewMemberBtn = document.getElementById('create-new-member-btn'),
            inviteMemberModal = document.getElementById('invite-member-modal'),
            inviteMemberSelectionList = document.getElementById('invite-member-selection-list'),
            confirmInviteBtn = document.getElementById('confirm-invite-btn'),
            createMemberForGroupModal = document.getElementById('create-member-for-group-modal'),
            createMemberForGroupForm = document.getElementById('create-member-for-group-form');
        const customizeForm = document.getElementById('customize-form'),
            tutorialContentArea = document.getElementById('tutorial-content-area');
        const groupRecipientSelectionModal = document.getElementById('group-recipient-selection-modal'),
            groupRecipientSelectionList = document.getElementById('group-recipient-selection-list'),
            confirmGroupRecipientBtn = document.getElementById('confirm-group-recipient-btn'),
            groupRecipientSelectionTitle = document.getElementById('group-recipient-selection-title');
        const linkGroupWorldBookBtn = document.getElementById('link-group-world-book-btn');

        // --- Dexie DB Setup ---
        const dexieDB = new Dexie('章鱼喷墨机DB_ee');
        dexieDB.version(1).stores({
            storage: 'key, value'
        });
        dexieDB.version(2).stores({
            characters: '&id',
            groups: '&id',
            worldBooks: '&id',
            myStickers: '&id, category',
            naiPromptModules: '&id, category', // ▼▼▼ 新增 ▼▼▼
            globalSettings: 'key'
        }).upgrade(async tx => {
            console.log("Upgrading database to version 2...");
            const oldData = await tx.table('storage').get('章鱼喷墨机');
            if (oldData && oldData.value) {
                console.log("Old data found, starting migration.");
                const data = JSON.parse(oldData.value);
                if (data.characters) await tx.table('characters').bulkPut(data.characters);
                if (data.groups) await tx.table('groups').bulkPut(data.groups);
                if (data.worldBooks) await tx.table('worldBooks').bulkPut(data.worldBooks);
                if (data.myStickers) await tx.table('myStickers').bulkPut(data.myStickers);
                
                const settingsToMigrate = {
                    apiSettings: data.apiSettings || {},
                    wallpaper: data.wallpaper || 'https://i.postimg.cc/W4Z9R9x4/ins-1.jpg',
                    homeScreenMode: data.homeScreenMode || 'night',
                    fontUrl: data.fontUrl || '',
                    customIcons: data.customIcons || {},
                    apiPresets: data.apiPresets || [],
                    bubbleCssPresets: data.bubbleCssPresets || [],
                    myPersonaPresets: data.myPersonaPresets || [],
                    globalCss: data.globalCss || '',
                    globalCssPresets: data.globalCssPresets || [],
                    homeSignature: data.homeSignature || '编辑个性签名...',
                    forumPosts: data.forumPosts || [],
                    forumBindings: data.forumBindings || { worldBookIds: [], charIds: [], userPersonaIds: [] },
                    pomodoroTasks: data.pomodoroTasks || [],
                    pomodoroSettings: data.pomodoroSettings || { boundCharId: null, userPersona: '', focusBackground: '', taskCardBackground: '', encouragementMinutes: 25, pokeLimit: 5, globalWorldBookIds: [] },
                    insWidgetSettings: data.insWidgetSettings || { avatar1: 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg', bubble1: 'love u.', avatar2: 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg', bubble2: 'miss u.' },
                    homeWidgetSettings: data.homeWidgetSettings || defaultWidgetSettings
                };

                const settingsPromises = Object.entries(settingsToMigrate).map(([key, value]) =>
                    tx.table('globalSettings').put({ key, value })
                );
                await Promise.all(settingsPromises);
                
                await tx.table('storage').delete('章鱼喷墨机');
                console.log("Migration complete. Old data removed.");
            } else {
                console.log("No old data found to migrate.");
            }
        });

        const saveData = async () => {
            await dexieDB.transaction('rw', dexieDB.tables, async () => {
                await dexieDB.characters.bulkPut(db.characters);
                await dexieDB.groups.bulkPut(db.groups);
                await dexieDB.worldBooks.bulkPut(db.worldBooks);
                await dexieDB.myStickers.bulkPut(db.myStickers);
                await dexieDB.naiPromptModules.bulkPut(db.naiPromptModules); // ▼▼▼ 新增 ▼▼▼

                const settingsPromises = globalSettingKeys.map(key => {
                    if (db[key] !== undefined) {
                        return dexieDB.globalSettings.put({ key: key, value: db[key] });
                    }
                    return null;
                }).filter(p => p);
                await Promise.all(settingsPromises);
            });
        };

        const loadData = async () => {
            // ▼▼▼ 修改这行，添加 naiPromptModules ▼▼▼
            const [characters, groups, worldBooks, myStickers, naiPromptModules, settingsArray] = await Promise.all([
                dexieDB.characters.toArray(),
                dexieDB.groups.toArray(),
                dexieDB.worldBooks.toArray(),
                dexieDB.myStickers.toArray(),
                dexieDB.naiPromptModules.toArray(), // ▼▼▼ 新增 ▼▼▼
                dexieDB.globalSettings.toArray()
            ]);

            db.characters = characters;
            db.groups = groups;
            db.worldBooks = worldBooks;
            db.myStickers = myStickers;
            db.naiPromptModules = naiPromptModules; // ▼▼▼ 新增 ▼▼▼

            const settings = settingsArray.reduce((acc, { key, value }) => {
                acc[key] = value;
                return acc;
            }, {});

            globalSettingKeys.forEach(key => {
                const defaultValue = {
                    apiSettings: {},
                    wallpaper: 'https://i.postimg.cc/W4Z9R9x4/ins-1.jpg',
                    homeScreenMode: 'night',
                    fontUrl: '',
                    customIcons: {},
                    stickerCategories: ['全部', '未分类'],
                    apiPresets: [],
                    bubbleCssPresets: [],
                    myPersonaPresets: [],
                    globalCss: '',
                    globalCssPresets: [],
                    homeSignature: '编辑个性签名...',
                    forumBindings: { worldBookIds: [], charIds: [], userPersonaIds: [] },
                    pomodoroTasks: [],
                    pomodoroSettings: { boundCharId: null, userPersona: '', focusBackground: '', taskCardBackground: '', encouragementMinutes: 25, pokeLimit: 5, globalWorldBookIds: [] },
                    insWidgetSettings: { avatar1: 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg', bubble1: 'love u.', avatar2: 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg', bubble2: 'miss u.' },
                    homeWidgetSettings: defaultWidgetSettings,
                    naiGlobalPromptPresets: [], // ▼▼▼ 新增 ▼▼▼
                    fontPresets: [] // ▼▼▼ 新增 ▼▼▼
                };
                db[key] = settings[key] !== undefined ? settings[key] : (defaultValue[key] !== undefined ? JSON.parse(JSON.stringify(defaultValue[key])) : undefined);
            });

            // Data integrity checks (can be kept)
            db.characters.forEach(c => {
                if (c.isPinned === undefined) c.isPinned = false;
                if (c.status === undefined) c.status = '在线';
                if (!c.worldBookIds) c.worldBookIds = [];
                if (c.customBubbleCss === undefined) c.customBubbleCss = '';
                if (c.useCustomBubbleCss === undefined) c.useCustomBubbleCss = false;
                // ▼▼▼ 新增 ▼▼▼
                if (!c.naiSettings) c.naiSettings = {}; // 用于存储 source
                if (!c.naiModuleIds) c.naiModuleIds = []; // 用于存储勾选
                // ▲▲▲ 新增结束 ▲▲▲
            });
            db.groups.forEach(g => {
                if (g.isPinned === undefined) g.isPinned = false;
                if (!g.worldBookIds) g.worldBookIds = [];
                if (g.customBubbleCss === undefined) g.customBubbleCss = '';
                if (g.useCustomBubbleCss === undefined) g.useCustomBubbleCss = false;
                // ▼▼▼ 新增 ▼▼▼
                if (!g.naiSettings) g.naiSettings = {}; // 用于存储 source
                if (!g.naiModuleIds) g.naiModuleIds = []; // 用于存储勾选
                // ▲▲▲ 新增结束 ▲▲▲
            });
            
            // Handle old localStorage data if it exists
            const oldLocalStorageData = localStorage.getItem('gemini-chat-app-db');
            if(oldLocalStorageData) {
                console.log("Found old localStorage data, migrating...");
                // This is a simplified migration, assuming the structure is the same as the old IndexedDB data
                const data = JSON.parse(oldLocalStorageData);
                await dexieDB.transaction('rw', dexieDB.tables, async () => {
                    if (data.characters) await dexieDB.characters.bulkPut(data.characters);
                    if (data.groups) await dexieDB.groups.bulkPut(data.groups);
                    // ... add other tables as needed
                });
                localStorage.removeItem('gemini-chat-app-db');
                // Reload data after migration
                await loadData();
            }
        };

        let notificationQueue = [];
        let isToastVisible = false;

        function processToastQueue() {
            if (isToastVisible || notificationQueue.length === 0) {
                return;
            }

        isToastVisible = true;
        const notification = notificationQueue.shift(); // 取出队列中的第一个通知

        const toastElement = document.getElementById('toast-notification');
        const avatarEl = toastElement.querySelector('.toast-avatar');
        const nameEl = toastElement.querySelector('.toast-name');
        const messageEl = toastElement.querySelector('.toast-message');

        const isRichNotification = typeof notification === 'object' && notification !== null && notification.name;

        if (isRichNotification) {
            toastElement.classList.remove('simple');
            avatarEl.style.display = 'block';
            nameEl.style.display = 'block';
            messageEl.style.textAlign = 'left';
            avatarEl.src = notification.avatar || 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg';
            nameEl.textContent = notification.name;
            messageEl.textContent = notification.message;
        } else {
            toastElement.classList.add('simple');
            avatarEl.style.display = 'none';
            nameEl.style.display = 'none';
            messageEl.style.textAlign = 'center';
            messageEl.textContent = notification;
        }

        toastElement.classList.add('show');

        // 设置定时器，在通知显示一段时间后将其隐藏
        setTimeout(() => {
            toastElement.classList.remove('show');
            
            // 等待隐藏动画（0.5秒）结束后，处理下一个通知
            setTimeout(() => {
                isToastVisible = false;
                processToastQueue(); // 尝试处理队列中的下一个通知
            }, 500);

        }, 1500); // 通知显示时间（1.5秒）
    }
    const showToast = (notification) => {
        notificationQueue.push(notification); // 将通知加入队列
        processToastQueue(); // 尝试处理队列
    };

    // ==================================================================================================================
    // ========================================== 错误处理翻译官 (Error Translator) ==========================================
    // ==================================================================================================================

    /**
     * 我们的"错误词典"，负责将技术性错误翻译成用户友好的提示。
     * @param {Error} error - 捕获到的错误对象。
     * @returns {string} - 返回一句通俗易懂的错误提示。
     */
    function getFriendlyErrorMessage(error) {
        // 检查 fetch 的 AbortError，这通常用于实现请求超时
        if (error.name === 'AbortError') {
            return '请求超时了，请检查您的网络或稍后再试。';
        }

        // 检查 JSON 解析错误，这对应您说的"返回格式错误"
        if (error instanceof SyntaxError) {
            return '服务器返回的数据格式不对，建议您点击"重回"按钮再试一次。';
        }

        // 检查服务器有响应、但HTTP状态码是失败的情况 (如 429, 504)
        if (error.response) {
            const status = error.response.status;
            switch (status) {
                case 429:
                    return '您点的太快啦，请稍等一下再试。';
                case 504:
                    return '服务器有点忙，响应不过来了，请稍后再试。';
                case 500:
                    return '服务器内部出错了，他们应该正在修复。';
                case 401:
                    return 'API密钥好像不对或者过期了，请检查一下设置。';
                case 404:
                    return '请求的API地址找不到了，请检查一下设置。';
                default:
                    // 对于其他未预设的HTTP错误，给一个通用提示
                    return `服务器返回了一个错误 (代码: ${status})，请稍后再试。`;
            }
        }

        // 检查通用的网络错误 (例如，断网了，fetch自己就会报TypeError)
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            return '网络连接好像出问题了，请检查一下网络。';
        }

        // 对于所有其他未知错误，显示原始信息，方便排查
        return `发生了一个未知错误：${error.message}`;
    }

    /**
     * 统一的API错误显示函数。
     * @param {Error} error - 捕获到的错误对象。
     */
    function showApiError(error) {
        // 在控制台打印详细错误，方便您自己调试
        console.error("API Error Detected:", error);

        // 获取翻译后的友好提示
        const friendlyMessage = getFriendlyErrorMessage(error);

        // 使用您项目中已有的 showToast 函数来显示提示
        showToast(friendlyMessage);
    }

    // ==================================================================================================================
    // ========================================== END Error Translator ==================================================
    // ==================================================================================================================



        const switchScreen = (targetId) => {
            screens.forEach(screen => screen.classList.remove('active'));
            document.getElementById(targetId)?.classList.add('active');
            // Close all overlays and sidebars
            const overlays = document.querySelectorAll('.modal-overlay, .action-sheet-overlay, .settings-sidebar');
            overlays.forEach(o => o.classList.remove('visible', 'open'));
        };
        const pad = (num) => num.toString().padStart(2, '0');

        function createContextMenu(items, x, y) {
            removeContextMenu();
            const menu = document.createElement('div');
            menu.className = 'context-menu';
            menu.style.left = `${x}px`;
            menu.style.top = `${y}px`;
            items.forEach(item => {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                if (item.danger) menuItem.classList.add('danger');
                menuItem.textContent = item.label;
                menuItem.onclick = () => {
                    item.action();
                    removeContextMenu();
                };
                menu.appendChild(menuItem);
            });
            document.body.appendChild(menu);
            document.addEventListener('click', removeContextMenu, {once: true});
        }

        function removeContextMenu() {
            const menu = document.querySelector('.context-menu');
            if (menu) menu.remove();
        }

        function updateCustomBubbleStyle(chatId, css, enabled) {
            const styleId = `custom-bubble-style-for-${chatId}`;
            let styleElement = document.getElementById(styleId);

            if (enabled && css) {
                if (!styleElement) {
                    styleElement = document.createElement('style');
                    styleElement.id = styleId;
                    document.head.appendChild(styleElement);
                }
                const scopedCss = css.replace(/(\.message-bubble(?:\.sent|\.received)?)/g, `#chat-room-screen.chat-active-${chatId} $1`);
                styleElement.innerHTML = scopedCss;
            } else {
                if (styleElement) styleElement.remove();
            }
        }

        function updateBubbleCssPreview(previewContainer, css, useDefault, theme) {
            previewContainer.innerHTML = '';

            const sentBubble = document.createElement('div');
            sentBubble.className = 'message-bubble sent';
            sentBubble.textContent = '这是我方气泡。';
            sentBubble.style.alignSelf = 'flex-end';
            sentBubble.style.borderBottomRightRadius = '5px';

            const receivedBubble = document.createElement('div');
            receivedBubble.className = 'message-bubble received';
            receivedBubble.textContent = '这是对方气泡。';
            receivedBubble.style.alignSelf = 'flex-start';
            receivedBubble.style.borderBottomLeftRadius = '5px';

            [sentBubble, receivedBubble].forEach(bubble => {
                bubble.style.maxWidth = '70%';
                bubble.style.padding = '8px 12px';
                bubble.style.wordWrap = 'break-word';
                bubble.style.lineHeight = '1.4';
            });

            if (useDefault || !css) {
                sentBubble.style.backgroundColor = theme.sent.bg;
                sentBubble.style.color = theme.sent.text;
                sentBubble.style.borderRadius = '18px';
                sentBubble.style.borderBottomRightRadius = '5px';
                receivedBubble.style.backgroundColor = theme.received.bg;
                receivedBubble.style.color = theme.received.text;
                receivedBubble.style.borderRadius = '18px';
                receivedBubble.style.borderBottomLeftRadius = '5px';
            } else {
                const styleTag = document.createElement('style');
                const scopedCss = css.replace(/(\.message-bubble(?:\.sent|\.received)?)/g, `#${previewContainer.id} $1`);
                styleTag.textContent = scopedCss;
                previewContainer.appendChild(styleTag);
            }
            previewContainer.appendChild(receivedBubble);
            previewContainer.appendChild(sentBubble);
        }
        const dataStorage = {
            getStorageInfo: async function() {
                const stringify = (obj) => {
                    try {
                        // Handle potential circular references, although unlikely with Dexie data
                        return JSON.stringify(obj).length;
                    } catch (e) {
                        console.warn("Could not stringify object for size calculation:", obj, e);
                        return 0;
                    }
                };

                let categorizedSizes = {
                    messages: 0,
                    charactersAndGroups: 0,
                    worldAndForum: 0,
                    personalization: 0,
                    apiAndCore: 0,
                    other: 0
                };

                // Ensure db is loaded, this is a safeguard.
                if (!db || !db.characters) {
                    await loadData();
                }

                // 1. Messages (History)
                (db.characters || []).forEach(char => {
                    categorizedSizes.messages += stringify(char.history);
                });
                (db.groups || []).forEach(group => {
                    categorizedSizes.messages += stringify(group.history);
                });

                // 2. Characters and Groups (metadata)
                (db.characters || []).forEach(char => {
                    const charWithoutHistory = { ...char, history: undefined };
                    categorizedSizes.charactersAndGroups += stringify(charWithoutHistory);
                });
                (db.groups || []).forEach(group => {
                    const groupWithoutHistory = { ...group, history: undefined };
                    categorizedSizes.charactersAndGroups += stringify(groupWithoutHistory);
                });

                // 3. World and Forum
                categorizedSizes.worldAndForum += stringify(db.worldBooks);
                categorizedSizes.worldAndForum += stringify(db.forumPosts);
                categorizedSizes.worldAndForum += stringify(db.forumBindings);

                // 4. Personalization
                categorizedSizes.personalization += stringify(db.myStickers);
                categorizedSizes.personalization += stringify(db.wallpaper);
                categorizedSizes.personalization += stringify(db.homeScreenMode);
                categorizedSizes.personalization += stringify(db.fontUrl);
                categorizedSizes.personalization += stringify(db.customIcons);
                categorizedSizes.personalization += stringify(db.bubbleCssPresets);
                categorizedSizes.personalization += stringify(db.myPersonaPresets);
                categorizedSizes.personalization += stringify(db.globalCss);
                categorizedSizes.personalization += stringify(db.globalCssPresets);
                categorizedSizes.personalization += stringify(db.homeSignature);
                categorizedSizes.personalization += stringify(db.pomodoroTasks);
                categorizedSizes.personalization += stringify(db.pomodoroSettings);
                categorizedSizes.personalization += stringify(db.insWidgetSettings);
                categorizedSizes.personalization += stringify(db.homeWidgetSettings);

                // 5. API and Core
                categorizedSizes.apiAndCore += stringify(db.apiSettings);
                categorizedSizes.apiAndCore += stringify(db.apiPresets);

                // Total size
                const totalSize = Object.values(categorizedSizes).reduce((sum, size) => sum + size, 0);

                return {
                    totalSize,
                    categorizedSizes
                };
            }
        };

        function setupStorageAnalysisScreen() {
            const screen = document.getElementById('storage-analysis-screen');
            const chartContainer = document.getElementById('storage-chart-container');
            const detailsList = document.getElementById('storage-details-list');
            let myChart = null;

            // 定义一个共享的颜色调色板
            const colorPalette = ['#ff80ab', '#90caf9', '#a5d6a7', '#fff59d', '#b39ddb', '#ffcc80'];

            const categoryNames = {
                messages: '聊天记录',
                charactersAndGroups: '角色与群组',
                worldAndForum: '世界书与论坛',
                personalization: '个性化设置',
                apiAndCore: '核心与API',
                other: '其他数据'
            };

            function formatBytes(bytes, decimals = 2) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const dm = decimals < 0 ? 0 : decimals;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
            }

            // 修改函数签名，接收颜色数组
            function renderStorageChart(info, colors) {
                if (!myChart) {
                    myChart = echarts.init(chartContainer);
                }

                const chartData = Object.entries(info.categorizedSizes)
                    .map(([key, value]) => ({
                        name: categoryNames[key] || key,
                        value: value
                    }))
                    .filter(item => item.value > 0);

                const option = {
                    // 将颜色数组应用到图表
                    color: colors,
                    tooltip: {
                        trigger: 'item',
                        formatter: '{a} <br/>{b}: {c} ({d}%)'
                    },
                    legend: {
                        show: false // 隐藏图例，因为我们下面有更详细的列表
                    },
                    series: [
                        {
                            name: '存储占比',
                            type: 'pie',
                            radius: ['50%', '70%'],
                            avoidLabelOverlap: false,
                            label: {
                                show: false,
                                position: 'center'
                            },
                            emphasis: {
                                label: {
                                    show: true,
                                    fontSize: '20',
                                    fontWeight: 'bold'
                                }
                            },
                            labelLine: {
                                show: false
                            },
                            data: chartData
                        }
                    ]
                };
                myChart.setOption(option);
            }

            // 修改函数签名，接收颜色数组
            function renderStorageDetails(info, colors) {
                detailsList.innerHTML = '';
                const totalSize = info.totalSize;

                const totalSizeEl = document.getElementById('storage-total-size');
                if (totalSizeEl) {
                    totalSizeEl.textContent = formatBytes(totalSize);
                }
        

                const sortedData = Object.entries(info.categorizedSizes)
                    .map(([key, value]) => ({
                        key: key,
                        name: categoryNames[key] || key,
                        value: value
                    }))
                    .sort((a, b) => b.value - a.value);

                // 不再从图表实例获取颜色，直接使用传入的参数
                sortedData.forEach((item, index) => {
                    if (item.value <= 0) return; // 不显示大小为0的项目
                    const percentage = totalSize > 0 ? ((item.value / totalSize) * 100).toFixed(2) : 0;
                    const color = colors[index % colors.length];

                    const detailItem = document.createElement('div');
                    detailItem.className = 'storage-detail-item';
                    detailItem.innerHTML = `
                        <div class="storage-color-indicator" style="background-color: ${color};"></div>
                        <div class="storage-detail-info">
                            <span class="storage-detail-name">${item.name}</span>
                            <span class="storage-detail-size">${formatBytes(item.value)}</span>
                        </div>
                        <span class="storage-detail-percentage">${percentage}%</span>
                    `;
                    detailsList.appendChild(detailItem);
                });
            }

            const observer = new MutationObserver(async (mutations) => {
                if (screen.classList.contains('active')) {
                    showToast('正在分析存储空间...');
                    const storageInfo = await dataStorage.getStorageInfo();
                    if (storageInfo) {
                        // 将颜色数组传递给两个函数
                        renderStorageChart(storageInfo, colorPalette);
                        renderStorageDetails(storageInfo, colorPalette);
                    } else {
                        showToast('分析失败');
                    }
                }
            });

            observer.observe(screen, { attributes: true, attributeFilter: ['class'] });
        }

        function renderPomodoroTasks() {
            const taskListContainer = document.getElementById('pomodoro-task-list');
            const placeholder = document.getElementById('pomodoro-no-tasks-placeholder');
            if (!taskListContainer || !placeholder) return;

            taskListContainer.innerHTML = ''; // Clear existing tasks

            if (!db.pomodoroTasks || db.pomodoroTasks.length === 0) {
                placeholder.style.display = 'block';
                taskListContainer.style.display = 'none';
                return;
            }

            placeholder.style.display = 'none';
            taskListContainer.style.display = 'flex';

            db.pomodoroTasks.forEach(task => {
                const wrapper = document.createElement('div');
                wrapper.className = 'task-card-wrapper';
                wrapper.dataset.id = task.id;

                const pomodorosText = task.mode === 'countdown' ? `倒计时模式` : '正计时模式';
                const durationText = task.mode === 'countdown' ? `${task.duration}分钟` : '';

                // 只使用任务自己的背景设置
                const backgroundUrl = task.settings?.taskCardBackground;
                let styleAttr = '';
                let textStyle = '';

                if (backgroundUrl) {
                    styleAttr = `style="background-image: url(${backgroundUrl}); background-size: cover; background-position: center;"`;
                    // 当有背景图时，让文字变白并增加阴影以提高可读性
                    textStyle = `style="color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.5);"`;
                }

                wrapper.innerHTML = `
                    <div class="task-card" ${styleAttr}>
                        <div class="task-card-info">
                            <h4 class="task-card-title" ${textStyle}>${DOMPurify.sanitize(task.name)}</h4>
                            <p class="task-card-details" ${textStyle}>${pomodorosText} ${durationText}</p>
                        </div>
                        <button class="task-card-start-btn">开始</button>
                    </div>
                    <button class="task-card-delete-btn">删除</button>
                `;
                taskListContainer.appendChild(wrapper);
            });
        }

        // ==================================================================================================================
        // =================================== 5. NAI 模块手册管理 (NAI Module Handbook) ===================================
        // ==================================================================================================================
       
        /**
         * (模块手册) 绑定所有模块管理器的事件
         */
        function setupNaiModuleSystem() {
            const managerModal = document.getElementById('nai-module-manager-modal');
            const editModal = document.getElementById('nai-module-edit-modal');
            const createBtn = document.getElementById('create-nai-module-btn');
            const saveSelectionBtn = document.getElementById('save-nai-module-selection-btn');
            const closeManagerBtn = document.getElementById('close-nai-module-manager');
            const editForm = document.getElementById('nai-module-edit-form');
            const cancelEditBtn = document.getElementById('cancel-nai-module-edit-btn');
            const moduleListContainer = document.getElementById('nai-module-list-container');

            // 1. 关闭主弹窗
            if (closeManagerBtn) {
                closeManagerBtn.addEventListener('click', () => managerModal.classList.remove('visible'));
            }
            // 2. 创建新模块
            if (createBtn) {
                createBtn.addEventListener('click', handleCreateNaiModule);
            }
            // 3. 保存勾选
            if (saveSelectionBtn) {
                saveSelectionBtn.addEventListener('click', handleSaveNaiModuleSelection);
            }
            // 4. 关闭编辑弹窗
            if (cancelEditBtn) {
                cancelEditBtn.addEventListener('click', () => editModal.classList.remove('visible'));
            }
            // 5. 提交编辑表单
            if (editForm) {
                editForm.addEventListener('submit', handleSaveNaiModuleEdit);
            }
            // 6. 列表事件委托 (用于编辑/删除)
            if (moduleListContainer) {
                moduleListContainer.addEventListener('click', (e) => {
                    // 检查是否是编辑按钮（优先检查按钮本身，然后检查按钮内的元素）
                    const editBtn = e.target.closest('.nai-module-edit-btn') || 
                                    (e.target.classList.contains('nai-module-edit-btn') ? e.target : null);
                    if (editBtn) {
                        e.stopPropagation();
                        e.preventDefault();
                        const moduleId = editBtn.dataset.id || editBtn.getAttribute('data-id');
                        if (moduleId) {
                            openNaiModuleEditModal(moduleId);
                        }
                        return;
                    }
                    
                    // 检查是否是删除按钮（优先检查按钮本身，然后检查按钮内的元素）
                    const deleteBtn = e.target.closest('.nai-module-delete-btn') || 
                                      (e.target.classList.contains('nai-module-delete-btn') ? e.target : null);
                    if (deleteBtn) {
                        e.stopPropagation();
                        e.preventDefault();
                        const moduleId = deleteBtn.dataset.id || deleteBtn.getAttribute('data-id');
                        if (moduleId) {
                            handleDeleteNaiModule(moduleId);
                        }
                        return;
                    }
                    
                    // 检查是否是复选框
                    if (e.target.type === 'checkbox' || e.target.closest('input[type="checkbox"]')) {
                        e.stopPropagation();
                        return;
                    }
                });
            }
        }

        /**
         * (模块手册) 打开主管理弹窗，并根据当前聊天室设置勾选状态
         */
        function openNaiModuleManageModal() {
            const modal = document.getElementById('nai-module-manager-modal');
            if (!modal) return;
            
            // 1. 获取当前聊天的已选模块
            const chat = (currentChatType === 'private')
                ? db.characters.find(c => c.id === currentChatId)
                : db.groups.find(g => g.id === currentChatId);
            
            if (!chat) return showToast('未找到当前聊天');
            
            const selectedModuleIds = new Set(chat.naiModuleIds || []);

            // 2. 渲染列表
            renderNaiModuleList(selectedModuleIds);
            
            // 3. 重置创建表单
            document.getElementById('new-nai-module-name').value = '';
            document.getElementById('new-nai-module-content').value = '';

            // 4. 显示弹窗
            modal.classList.add('visible');
        }

        /**
         * (模块手册) 渲染全局模块列表到弹窗中
         * @param {Set<string>} selectedModuleIds - 当前聊天已勾选的模块ID
         */
        function renderNaiModuleList(selectedModuleIds) {
            const container = document.getElementById('nai-module-list-container');
            if (!container) return;
            
            container.innerHTML = ''; // 清空
            
            if (!db.naiPromptModules || db.naiPromptModules.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #aaa;">暂无模块，请在上方创建</p>';
                return;
            }

            // 直接渲染所有模块，不分类
            db.naiPromptModules.forEach(module => {
                const isChecked = selectedModuleIds.has(module.id);
                const item = document.createElement('div');
                item.className = 'nai-module-item';
                item.innerHTML = `
                    <input type="checkbox" class="nai-module-checkbox" value="${module.id}" ${isChecked ? 'checked' : ''}>
                    <div class="nai-module-item-details">
                        <div class="nai-module-item-name">${DOMPurify.sanitize(module.name)}</div>
                    </div>
                    <div class="nai-module-item-actions">
                        <button type="button" class="btn btn-neutral btn-small nai-module-edit-btn" data-id="${module.id}">编辑</button>
                        <button type="button" class="btn btn-danger btn-small nai-module-delete-btn" data-id="${module.id}">删除</button>
                    </div>
                `;
                container.appendChild(item);
            });
        }

        /**
         * (模块手册) 处理创建新模块
         */
        async function handleCreateNaiModule() {
            const name = document.getElementById('new-nai-module-name').value.trim();
            const content = document.getElementById('new-nai-module-content').value.trim();

            if (!name || !content) {
                return showToast('模块名称和内容不能为空');
            }

            const newModule = {
                id: `nai_mod_${Date.now()}`,
                name: name,
                content: content
            };

            db.naiPromptModules.push(newModule);
            await saveData();

            // 重新渲染列表（保持勾选状态）
            const chat = (currentChatType === 'private')
                ? db.characters.find(c => c.id === currentChatId)
                : db.groups.find(g => g.id === currentChatId);
            const selectedModuleIds = new Set(chat.naiModuleIds || []);
            renderNaiModuleList(selectedModuleIds);

            // 清空输入框
            document.getElementById('new-nai-module-name').value = '';
            document.getElementById('new-nai-module-content').value = '';
            showToast('新模块已添加到全局手册');
        }

        /**
         * (模块手册) 打开编辑弹窗
         * @param {string} moduleId - 模块ID
         */
        function openNaiModuleEditModal(moduleId) {
            const module = db.naiPromptModules.find(m => m.id === moduleId);
            if (!module) return showToast('找不到该模块');

            document.getElementById('edit-nai-module-id').value = module.id;
            document.getElementById('edit-nai-module-name').value = module.name;
            document.getElementById('edit-nai-module-content').value = module.content;

            document.getElementById('nai-module-edit-modal').classList.add('visible');
        }

        /**
         * (模块手册) 保存编辑
         */
        async function handleSaveNaiModuleEdit(e) {
            e.preventDefault();
            const moduleId = document.getElementById('edit-nai-module-id').value;
            const module = db.naiPromptModules.find(m => m.id === moduleId);
            if (!module) return showToast('保存失败，找不到模块');

            module.name = document.getElementById('edit-nai-module-name').value.trim();
            module.content = document.getElementById('edit-nai-module-content').value.trim();

            if (!module.name || !module.content) {
                return showToast('模块名称和内容不能为空');
            }

            await saveData();
            document.getElementById('nai-module-edit-modal').classList.remove('visible');
            
            // 重新渲染列表
            const chat = (currentChatType === 'private')
                ? db.characters.find(c => c.id === currentChatId)
                : db.groups.find(g => g.id === currentChatId);
            const selectedModuleIds = new Set(chat.naiModuleIds || []);
            renderNaiModuleList(selectedModuleIds);
            
            showToast('模块已更新');
        }

        /**
         * (模块手册) 删除模块
         * @param {string} moduleId - 模块ID
         */
        async function handleDeleteNaiModule(moduleId) {
            const module = db.naiPromptModules.find(m => m.id === moduleId);
            if (!module) return;

            if (confirm(`确定要从"全局手册"中删除模块 "${module.name}" 吗？\n此操作不可逆，且会从所有已挂载的聊天中移除它。`)) {
                // 1. 从全局库删除
                db.naiPromptModules = db.naiPromptModules.filter(m => m.id !== moduleId);
                
                // 2. 从所有角色中移除引用
                db.characters.forEach(chat => {
                    if (chat.naiModuleIds) {
                        chat.naiModuleIds = chat.naiModuleIds.filter(id => id !== moduleId);
                    }
                });
                
                // 3. 从所有群聊中移除引用
                db.groups.forEach(chat => {
                    if (chat.naiModuleIds) {
                        chat.naiModuleIds = chat.naiModuleIds.filter(id => id !== moduleId);
                    }
                });

                await saveData();
                
                // 4. 重新渲染列表
                const chat = (currentChatType === 'private')
                    ? db.characters.find(c => c.id === currentChatId)
                    : db.groups.find(g => g.id === currentChatId);
                const selectedModuleIds = new Set(chat.naiModuleIds || []);
                renderNaiModuleList(selectedModuleIds);
                
                showToast('模块已从全局手册删除');
            }
        }

        /**
         * (模块手册) 保存当前聊天的模块"挂载"
         */
        async function handleSaveNaiModuleSelection() {
            const chat = (currentChatType === 'private')
                ? db.characters.find(c => c.id === currentChatId)
                : db.groups.find(g => g.id === currentChatId);
            
            if (!chat) return showToast('保存失败，未找到当前聊天');

            const container = document.getElementById('nai-module-list-container');
            const selectedIds = Array.from(container.querySelectorAll('.nai-module-checkbox:checked')).map(cb => cb.value);

            chat.naiModuleIds = selectedIds;
            await saveData();

            document.getElementById('nai-module-manager-modal').classList.remove('visible');
            showToast('当前聊天的挂载模块已保存！');
        }

        function setupPomodoroApp() {
            const createTaskBtn = document.getElementById('pomodoro-create-task-btn');
            const createModal = document.getElementById('pomodoro-create-modal');
            const createForm = document.getElementById('pomodoro-create-form');
            const modeRadios = document.querySelectorAll('input[name="pomodoro-mode"]');
            const durationOptions = document.getElementById('pomodoro-duration-options');
            const durationPills = durationOptions.querySelectorAll('.duration-pill');
            const customDurationInput = document.getElementById('pomodoro-custom-duration-input');

            // Focus Screen elements
            const focusScreen = document.getElementById('pomodoro-focus-screen');
            const focusTitleEl = focusScreen.querySelector('.focus-task-title');
            const focusTimerEl = focusScreen.querySelector('.focus-timer-display');
            const focusModeEl = focusScreen.querySelector('.focus-timer-mode');
            const startBtn = document.getElementById('pomodoro-start-btn');
            const pauseBtn = document.getElementById('pomodoro-pause-btn');
            const giveUpBtn = document.getElementById('pomodoro-giveup-btn');
            const focusAvatar = focusScreen.querySelector('.focus-avatar');
            const focusMessageBubble = focusScreen.querySelector('.focus-message-bubble');

            if (focusAvatar && focusMessageBubble) {
                focusAvatar.addEventListener('click', () => {
                    // "Poke" feature logic
                    if (isPomodoroPaused || !pomodoroInterval || !currentPomodoroTask) return;

                    pomodoroIsInterrupted = true;
                    pomodoroPokeCount++;

                    const pokeLimit = currentPomodoroTask.settings.pokeLimit || 5;

                    if (pomodoroPokeCount > pokeLimit) {
                        showTypewriterMessage(focusMessageBubble.querySelector('p'), '传讯次数已经到达上限啦，请再专心一点吧宝宝^^');
                    } else {
                        getPomodoroAiReply('poke');
                    }
                });
            }


            // --- Timer Core Logic ---
            function updateTimerDisplay() {
                const hours = Math.floor(pomodoroRemainingSeconds / 3600);
                const minutes = Math.floor((pomodoroRemainingSeconds % 3600) / 60);
                const seconds = pomodoroRemainingSeconds % 60;

                if (pomodoroRemainingSeconds >= 3600) {
                    focusTimerEl.textContent = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                } else {
                    focusTimerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                }
            }

            function updateTotalFocusedTimeDisplay() {
                const totalMinutes = Math.floor(pomodoroCurrentSessionSeconds / 60);
                const totalTimeEl = document.getElementById('pomodoro-total-focused-time');
                if (totalTimeEl) {
                    totalTimeEl.textContent = `已专注 ${totalMinutes} 分钟`;
                }
            }

            function stopTimer() {
                clearInterval(pomodoroInterval);
                pomodoroInterval = null;
                isPomodoroPaused = true;
                startBtn.style.display = 'inline-flex';
                pauseBtn.style.display = 'none';
            }

            function startTimer() {
                if (pomodoroInterval) return; // Already running

                // NEW: Check for resume from a paused state
                if (isPomodoroPaused && pomodoroCurrentSessionSeconds > 0) {
                    getPomodoroAiReply('resume');
                }

                isPomodoroPaused = false;
                pomodoroIsInterrupted = false; // Also reset this flag on resume
                startBtn.style.display = 'none';
                pauseBtn.style.display = 'inline-flex';

                pomodoroInterval = setInterval(() => {
                    if (currentPomodoroTask.mode === 'countdown') {
                        pomodoroRemainingSeconds--;
                    } else { // stopwatch
                        pomodoroRemainingSeconds++;
                    }
                    pomodoroCurrentSessionSeconds++;
                    updateTimerDisplay();
                    updateTotalFocusedTimeDisplay();

                    // Check for encouragement
                    if (currentPomodoroTask && currentPomodoroTask.settings) {
                        const encouragementMinutes = currentPomodoroTask.settings.encouragementMinutes || 25;
                        if (pomodoroCurrentSessionSeconds > 0 && (pomodoroCurrentSessionSeconds % (encouragementMinutes * 60)) === 0 && !pomodoroIsInterrupted) {
                            getPomodoroAiReply('encouragement');
                        }
                    }

                    if (currentPomodoroTask.mode === 'countdown' && pomodoroRemainingSeconds <= 0) {
                        stopTimer();
                        handlePomodoroCompletion();
                    }
                }, 1000);
            }

            function pauseTimer() {
                pomodoroIsInterrupted = true; // Pausing counts as an interruption
                isPomodoroPaused = true;
                clearInterval(pomodoroInterval);
                pomodoroInterval = null;
                startBtn.style.display = 'inline-flex';
                pauseBtn.style.display = 'none';
            }

            // --- Event Listeners for Controls ---
            startBtn.addEventListener('click', startTimer);
            pauseBtn.addEventListener('click', pauseTimer);
            giveUpBtn.addEventListener('click', () => {
                if (confirm('确定要放弃当前任务吗？')) {
                    stopTimer();
                    currentPomodoroTask = null;
                    switchScreen('pomodoro-screen');
                }
            });

            // Certificate modal listeners
            const certModal = document.getElementById('pomodoro-certificate-modal');
            const forwardCertBtn = document.getElementById('forward-certificate-btn');
            const closeCertBtn = document.getElementById('close-certificate-btn');

            forwardCertBtn.addEventListener('click', async () => {
                const taskName = document.getElementById('cert-task-name').textContent;
                const duration = document.getElementById('cert-duration').textContent;
                const pokeCount = document.getElementById('cert-poke-count').textContent;
                const chat = db.characters.find(c => c.id === currentPomodoroTask.settings.boundCharId);

                if (chat) {
                    const messageContent = `[专注记录] 任务：${taskName}，时长：${duration}，期间与 ${chat.realName} 互动 ${pokeCount} 次。`;
                    const message = {
                        id: `msg_pomodoro_${Date.now()}`,
                        role: 'user',
                        content: messageContent,
                        parts: [{ type: 'text', text: messageContent }],
                        timestamp: Date.now(),
                        senderId: 'user_me'
                    };
                    chat.history.push(message);
                    await saveData();
                    showToast('已转发到聊天框！');
                    renderChatList();
                }
                certModal.classList.remove('visible');
                switchScreen('pomodoro-screen');
            });

            closeCertBtn.addEventListener('click', () => {
                certModal.classList.remove('visible');
                switchScreen('pomodoro-screen');
            });


            function handlePomodoroCompletion() {
                const certModal = document.getElementById('pomodoro-certificate-modal');
                document.getElementById('cert-task-name').textContent = currentPomodoroTask.name;
                const totalMinutes = Math.floor(pomodoroCurrentSessionSeconds / 60);
                document.getElementById('cert-duration').textContent = `${totalMinutes} 分钟`;
                document.getElementById('cert-poke-count').textContent = pomodoroPokeCount;

                // 新增：清空并隐藏对话框
                const focusMessageBubble = document.querySelector('#pomodoro-focus-screen .focus-message-bubble');
                if (focusMessageBubble) {
                    focusMessageBubble.classList.remove('visible');
                    focusMessageBubble.querySelector('p').textContent = '';
                }

                // No longer call AI for completion
                certModal.classList.add('visible');
            }

            function showPomodoroTypingIndicator(element) {
                element.innerHTML = '对方正在输入中<span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>';
            }

            function showTypewriterMessage(element, text) {
                let i = 0;
                element.innerHTML = ''; // Clear previous content
                const typingInterval = setInterval(() => {
                    if (i < text.length) {
                        element.textContent += text.charAt(i);
                        i++;
                    } else {
                        clearInterval(typingInterval);
                    }
                }, 50);
            }

            async function getPomodoroAiReply(promptType) {
                const focusMessageBubble = document.querySelector('.focus-message-bubble');
                const messageP = focusMessageBubble.querySelector('p');
                const settings = currentPomodoroTask.settings;
                const character = db.characters.find(c => c.id === settings.boundCharId);

                if (!character) {
                    focusMessageBubble.classList.remove('visible');
                    return;
                }

                const userPersonaPreset = db.myPersonaPresets.find(p => p.name === settings.userPersona);
                const userPersona = userPersonaPreset ? userPersonaPreset.persona : '一个普通人';

                let prompt;
                const totalMinutes = Math.floor(pomodoroCurrentSessionSeconds / 60);
                const remainingMinutes = Math.round(pomodoroRemainingSeconds / 60);
                const taskName = currentPomodoroTask.name;

                switch (promptType) {
                    case 'encouragement':
                        if (currentPomodoroTask.mode === 'countdown') {
                            prompt = `你正在扮演[${character.realName}]。用户正在进行专注任务“${taskName}”，已连续专注了[${totalMinutes}]分钟，还剩下大约[${remainingMinutes}]分钟。请根据你的人设、任务内容和剩余时间，以鼓励用户为目的，给用户发送一条文字消息。`;
                        } else { // stopwatch
                            prompt = `你正在扮演[${character.realName}]。用户正在进行专注任务“${taskName}”，已经连续专注了[${totalMinutes}]分钟。请根据你的人设和任务内容，以鼓励用户为目的，给用户发送一条文字消息。`;
                        }
                        break;
                    case 'poke':
                        if (currentPomodoroTask.mode === 'countdown') {
                            prompt = `你正在扮演[${character.realName}]。用户在进行专注任务“${taskName}”时，专注了[${totalMinutes}]分钟（还剩下大约[${remainingMinutes}]分钟），忍不住第${pomodoroPokeCount}次戳了戳你的头像。请根据你的人设、任务内容和剩余时间，给用户回复一条文字消息。`;
                        } else { // stopwatch
                            prompt = `你正在扮演[${character.realName}]。用户在进行专注任务“${taskName}”时，已经连续专注了[${totalMinutes}]分钟，这时忍不住第${pomodoroPokeCount}次戳了戳你的头像。请根据你的人设和任务内容，给用户回复一条文字消息。`;
                        }
                        break;
                    case 'resume':
                        prompt = `你正在扮演[${character.realName}]。用户正在进行专注任务“${taskName}”，刚刚暂停了任务后又重新开始了。请根据你的人设，给用户回复一条文字消息。`;
                        break;
                }

                // NEW: Add session history context
                if (pomodoroSessionHistory && pomodoroSessionHistory.length > 0) {
                    const myName = character.myName || '我';
                    const charName = character.realName || '角色';
                    const historyContext = pomodoroSessionHistory.map(item => {
                        if (item.type === 'user') {
                            return `[${myName}的消息：(执行操作: ${item.content})]`;
                        } else {
                            return `[${charName}的消息：${item.content}]`;
                        }
                    }).join('\n');
                    prompt += `\n\n【本次专注期间的简短互动历史】\n${historyContext}\n\n请基于以上历史，继续你的下一句回应。`;
                }
 
                focusMessageBubble.classList.add('visible');
                showPomodoroTypingIndicator(messageP);

                try {
                    const { url, key, model } = db.apiSettings;
                    if (!url || !key || !model) {
                        messageP.textContent = 'API未配置，无法获取回应。';
                        return;
                    }

                    // --- NEW: Construct system prompt with world books ---
                    const globalWorldBookIds = db.pomodoroSettings?.globalWorldBookIds || [];
                    const globalWorldBooksBefore = globalWorldBookIds
                        .map(id => db.worldBooks.find(wb => wb.id === id && wb.position === 'before'))
                        .filter(Boolean)
                        .map(wb => wb.content)
                        .join('\n\n');
                    const globalWorldBooksAfter = globalWorldBookIds
                        .map(id => db.worldBooks.find(wb => wb.id === id && wb.position === 'after'))
                        .filter(Boolean)
                        .map(wb => wb.content)
                        .join('\n\n');

                    let systemPromptContent = `你正在扮演角色。你的名字是${character.realName}。`;
                    if (globalWorldBooksBefore) {
                        systemPromptContent += `\n\n【全局世界观设定】\n${globalWorldBooksBefore}`;
                    }
                    systemPromptContent += `\n\n【你的角色设定】\n人设: ${character.persona}`;
                    if (globalWorldBooksAfter) {
                        systemPromptContent += `\n\n【补充设定】\n${globalWorldBooksAfter}`;
                    }
                    systemPromptContent += `\n\n【我的角色设定】\n我的名字是${character.myName}，人设是：${userPersona}。`;
                    // --- END NEW ---

                    const response = await fetch(`${url}/v1/chat/completions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${key}`
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [
                                { role: 'system', content: systemPromptContent },
                                { role: 'user', content: prompt }
                            ],
                            temperature: 0.8
                        })
                    });

                    if (!response.ok) {
                        throw new Error('API请求失败');
                    }

                    const result = await response.json();
                    const reply = result.choices[0].message.content;

                    // NEW: Add user action and AI reply to session history
                    pomodoroSessionHistory.push({ type: 'user', content: promptType });
                    pomodoroSessionHistory.push({ type: 'ai', content: reply });
                    // Keep history short, e.g., last 4 pairs
                    if (pomodoroSessionHistory.length > 8) {
                        pomodoroSessionHistory.splice(0, 2);
                    }

                    showTypewriterMessage(messageP, reply);
 
                    // If the reply was for a 'poke', start a timer to reset the interruption flag.
                    if (promptType === 'poke') {
                        setTimeout(() => {
                            pomodoroIsInterrupted = false;
                        }, 10000); // 10 seconds
                    }

                } catch (error) {
                    console.error('获取AI回应失败:', error);
                    messageP.textContent = '获取回应失败，请检查网络或API设置。';
                }
            }


            // Show create task modal
            if (createTaskBtn) {
                createTaskBtn.addEventListener('click', () => {
                    // Reset form to default state on open
                    createForm.reset();
                    durationOptions.classList.add('visible');
                    durationPills.forEach(p => p.classList.remove('active'));
                    if (durationPills.length > 0) {
                        durationPills[0].classList.add('active');
                    }
                    customDurationInput.style.display = 'none';
                    document.getElementById('mode-countdown').checked = true;
                    document.getElementById('mode-stopwatch').checked = false;

                    createModal.classList.add('visible');
                });
            }

            // Handle mode change (countdown vs stopwatch)
            modeRadios.forEach(radio => {
                radio.addEventListener('change', () => {
                    if (radio.value === 'countdown') {
                        durationOptions.classList.add('visible');
                    } else {
                        durationOptions.classList.remove('visible');
                    }
                });
            });

            // Handle duration pill selection
            durationPills.forEach(pill => {
                pill.addEventListener('click', () => {
                    durationPills.forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    if (pill.dataset.duration === 'custom') {
                        customDurationInput.style.display = 'block';
                        customDurationInput.focus();
                    } else {
                        customDurationInput.style.display = 'none';
                    }
                });
            });

            // Handle form submission
            if (createForm) {
                createForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const taskName = document.getElementById('pomodoro-task-name').value.trim();
                    if (!taskName) {
                        showToast('请输入任务名称');
                        return;
                    }

                    const mode = document.querySelector('input[name="pomodoro-mode"]:checked').value;
                    let duration = 0;

                    if (mode === 'countdown') {
                        const activePill = durationOptions.querySelector('.duration-pill.active');
                        if (activePill.dataset.duration === 'custom') {
                            duration = parseInt(customDurationInput.value, 10);
                            if (isNaN(duration) || duration <= 0) {
                                showToast('请输入有效的自定义分钟数');
                                return;
                            }
                        } else {
                            duration = parseInt(activePill.dataset.duration, 10);
                        }
                    }

                    const newTask = {
                        id: `pomodoro_${Date.now()}`,
                        name: taskName,
                        mode: mode,
                        duration: duration,
                        status: 'pending',
                        // 为每个任务创建独立的设置副本
                        // 为每个任务创建独立的设置副本，但确保背景是空的
                        settings: {
                            ...JSON.parse(JSON.stringify(db.pomodoroSettings)),
                            focusBackground: '',
                            taskCardBackground: ''
                        }
                    };

                    if (!db.pomodoroTasks) {
                        db.pomodoroTasks = [];
                    }
                    db.pomodoroTasks.push(newTask);
                    await saveData();

                    showToast(`任务 "${taskName}" 已创建`);
                    renderPomodoroTasks();

                    createModal.classList.remove('visible');
                });
            }

            const screen = document.getElementById('pomodoro-screen');
            if (screen) {
                const observer = new MutationObserver(() => {
                    if (screen.classList.contains('active')) {
                        renderPomodoroTasks();
                    }
                });
                observer.observe(screen, { attributes: true, attributeFilter: ['class'] });
            }

            const taskListContainer = document.getElementById('pomodoro-task-list');

            // --- Swipe to delete logic ---
            let touchStartX = 0;
            let touchCurrentX = 0;
            let swipedCardWrapper = null;
            let isDragging = false;
            const swipeThreshold = 50; // Min pixels to trigger swipe

            const handleSwipeStart = (x, target) => {
                touchStartX = x;
                isDragging = true;
                // Close any other swiped card
                const targetWrapper = target.closest('.task-card-wrapper');
                if (swipedCardWrapper && swipedCardWrapper !== targetWrapper) {
                    swipedCardWrapper.classList.remove('is-swiped');
                    swipedCardWrapper = null;
                }
            };

            const handleSwipeMove = (x, target) => {
                if (!isDragging) return;
                const cardWrapper = target.closest('.task-card-wrapper');
                if (!cardWrapper) return;

                touchCurrentX = x;
                const deltaX = touchCurrentX - touchStartX;

                // Only allow left swipe
                if (deltaX < 0) {
                    // Prevent over-swiping
                    const distance = Math.max(deltaX, -80);
                    cardWrapper.querySelector('.task-card').style.transform = `translateX(${distance}px)`;
                }
            };

            const handleSwipeEnd = (target) => {
                if (!isDragging) return;
                isDragging = false;

                const cardWrapper = target.closest('.task-card-wrapper');
                if (!cardWrapper) return;

                const card = cardWrapper.querySelector('.task-card');
                const deltaX = touchCurrentX - touchStartX;

                // Reset inline style
                card.style.transform = '';

                if (deltaX < -swipeThreshold) {
                    cardWrapper.classList.add('is-swiped');
                    swipedCardWrapper = cardWrapper;
                } else {
                    cardWrapper.classList.remove('is-swiped');
                    if (swipedCardWrapper === cardWrapper) {
                        swipedCardWrapper = null;
                    }
                }
                
                // Reset positions
                touchStartX = 0;
                touchCurrentX = 0;
            };

            taskListContainer.addEventListener('touchstart', (e) => {
                handleSwipeStart(e.touches[0].clientX, e.target);
            }, { passive: true });

            taskListContainer.addEventListener('touchmove', (e) => {
                handleSwipeMove(e.touches[0].clientX, e.target);
            }, { passive: true });

            taskListContainer.addEventListener('touchend', (e) => {
                handleSwipeEnd(e.target);
            });
            
            // Mouse events for desktop
            taskListContainer.addEventListener('mousedown', (e) => {
                if (e.target.closest('.task-card-start-btn') || e.target.closest('.task-card-delete-btn')) return;
                handleSwipeStart(e.clientX, e.target);
            });

            taskListContainer.addEventListener('mousemove', (e) => {
                handleSwipeMove(e.clientX, e.target);
            });

            taskListContainer.addEventListener('mouseup', (e) => {
                handleSwipeEnd(e.target);
            });
            
            taskListContainer.addEventListener('mouseleave', (e) => {
                if (isDragging) {
                    handleSwipeEnd(e.target);
                }
            });


            // --- Click handling for start and delete ---
            if (taskListContainer) {
                taskListContainer.addEventListener('click', async (e) => {
                    const startBtn = e.target.closest('.task-card-start-btn');
                    const deleteBtn = e.target.closest('.task-card-delete-btn');
                    const cardWrapper = e.target.closest('.task-card-wrapper');

                    if (deleteBtn && cardWrapper) {
                        const taskId = cardWrapper.dataset.id;
                        if (confirm('确定要删除这个任务吗？')) {
                            db.pomodoroTasks = db.pomodoroTasks.filter(t => t.id !== taskId);
                            await saveData();
                            renderPomodoroTasks();
                            showToast('任务已删除');
                        }
                    } else if (startBtn && cardWrapper) {
                        const taskId = cardWrapper.dataset.id;
                        const task = db.pomodoroTasks.find(t => t.id === taskId);
                        
                        if (task) {
                            // --- Start Focus Session ---
                            currentPomodoroTask = task;
                            stopTimer(); // Ensure any previous timer is stopped
                            pomodoroCurrentSessionSeconds = 0; // Reset session timer
                            pomodoroPokeCount = 0; // Reset poke count
                            pomodoroIsInterrupted = false; // Reset interruption flag
                            pomodoroSessionHistory = []; // NEW: Reset session history
 
                            // 新增：清空并隐藏对话框
                            const focusMessageBubble = document.querySelector('#pomodoro-focus-screen .focus-message-bubble');
                            if (focusMessageBubble) {
                                focusMessageBubble.classList.remove('visible');
                                focusMessageBubble.querySelector('p').textContent = '';
                            }

                            focusTitleEl.textContent = task.name;
                            focusModeEl.textContent = task.mode === 'countdown' ? '倒计时' : '正计时';
                            
                            if (task.mode === 'countdown') {
                                pomodoroRemainingSeconds = task.duration * 60;
                            } else {
                                pomodoroRemainingSeconds = 0;
                            }
                            
                            updateTimerDisplay();
                            updateTotalFocusedTimeDisplay(); // Update display to show 0

                            // NEW: Update avatar based on bound character
                            const focusAvatarEl = document.querySelector('#pomodoro-focus-screen .focus-avatar');
                            if (task.settings && task.settings.boundCharId) {
                                const boundChar = db.characters.find(c => c.id === task.settings.boundCharId);
                                if (boundChar && focusAvatarEl) {
                                    focusAvatarEl.src = boundChar.avatar;
                                } else if (focusAvatarEl) {
                                    focusAvatarEl.src = 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg'; // Fallback
                                }
                            } else if (focusAvatarEl) {
                                focusAvatarEl.src = 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg'; // Fallback
                            }
                            // END NEW
 
                            applyPomodoroBackgrounds(); // Apply backgrounds when starting a task
                            // Timer is now started from the focus screen, not automatically.
                            switchScreen('pomodoro-focus-screen');
                        }
                    } else if (cardWrapper && !cardWrapper.classList.contains('is-swiped')) {
                        // If a non-swiped card is clicked, close any open one
                        if (swipedCardWrapper) {
                            swipedCardWrapper.classList.remove('is-swiped');
                            swipedCardWrapper = null;
                        }
                    }
                });
            }
        }

        const init = async () => {
            await loadData();
            if (!db.homeWidgetSettings || !db.homeWidgetSettings.topLeft) {
            db.homeWidgetSettings = JSON.parse(JSON.stringify(defaultWidgetSettings));
            }
            document.body.addEventListener('click', (e) => {
                if (e.target.closest('.context-menu')) {
                    e.stopPropagation();
                    return;
                }
                removeContextMenu();

                const backBtn = e.target.closest('.back-btn');
                if (backBtn) {
                    e.preventDefault();
                    switchScreen(backBtn.getAttribute('data-target'));
                }

                // Consolidated overlay closing logic
                const openOverlay = document.querySelector('.modal-overlay.visible, .action-sheet-overlay.visible');
                if (openOverlay && e.target === openOverlay) {
                    openOverlay.classList.remove('visible');
                }
            });

            // Specific nav links that switch screens
            document.body.addEventListener('click', e => {
                const navLink = e.target.closest('.app-icon[data-target]');
                if (navLink) {
                    e.preventDefault();
                    const target = navLink.getAttribute('data-target');

                    // 这些由 setupHomeScreen() 中的特定监听器处理，这里忽略
                    if (target === 'world-book-screen' || target === 'customize-screen' || target === 'tutorial-screen') {
                        return;
                    }
                    
                    if (target === 'music-screen' || target === 'diary-screen' || target === 'piggy-bank-screen') {
                        showToast('该应用正在开发中，敬请期待！');
                        return;
                    }
                    switchScreen(target);
                }
            });

            updateClock();
            setInterval(updateClock, 30000);
            applyGlobalFont(db.fontUrl);
            applyGlobalCss(db.globalCss);
            applyPomodoroBackgrounds();
            setupHomeScreen();
            setupChatListScreen();
            setupAddCharModal();
            setupChatRoom();
            setupChatSettings();
            setupApiSettingsApp();
                        await setupStickerSystem();
            setupPresetFeatures();
            setupVoiceMessageSystem();
            setupPhotoVideoSystem();
            setupImageRecognition();
            setupWalletSystem();
            setupGiftSystem();
            setupTimeSkipSystem();
            setupWorldBookApp();
            setupFontSettingsApp();
            setupGroupChatSystem();
            setupCustomizeApp();
            setupTutorialApp();
            checkForUpdates();
            setupPeekFeature();
            setupAiWalletApp(); // <-- 添加这一行
            setupChatExpansionPanel();
            setupMemoryJournalScreen(); // 新增：初始化回忆日记功能
            setupDeleteHistoryChunk();
            setupForumBindingFeature();
            setupForumFeature();
            setupShareModal();
            setupStorageAnalysisScreen();
            setupNaiModuleSystem(); // <-- 确认这行已添加
            setupPomodoroApp();
            setupPomodoroSettings();
            setupPomodoroGlobalSettings(); // NEW: Setup global settings
            setupInsWidgetAvatarModal();
            setupHeartPhotoModal();
            setupPeekCharacterSelectScreen(); // <-- 新增
        };

        function setupInsWidgetAvatarModal() {
            const modal = document.getElementById('ins-widget-avatar-modal');
            const form = document.getElementById('ins-widget-avatar-form');
            const preview = document.getElementById('ins-widget-avatar-preview');
            const urlInput = document.getElementById('ins-widget-avatar-url-input');
            const fileUpload = document.getElementById('ins-widget-avatar-file-upload');
            const targetInput = document.getElementById('ins-widget-avatar-target');

            // Use event delegation on homeScreen for avatars since it's re-rendered
            const homeScreen = document.getElementById('home-screen');
            homeScreen.addEventListener('click', (e) => {
                const avatar1 = e.target.closest('#ins-widget-avatar-1');
                const avatar2 = e.target.closest('#ins-widget-avatar-2');

                let targetAvatarId = null;
                let currentSrc = '';

                if (avatar1) {
                    targetAvatarId = 'avatar1';
                    currentSrc = db.insWidgetSettings.avatar1;
                } else if (avatar2) {
                    targetAvatarId = 'avatar2';
                    currentSrc = db.insWidgetSettings.avatar2;
                }

                if (targetAvatarId) {
                    targetInput.value = targetAvatarId;
                    preview.style.backgroundImage = `url("${currentSrc}")`;
                    preview.innerHTML = ''; // Clear "预览" text
                    urlInput.value = '';
                    fileUpload.value = null;
                    modal.classList.add('visible');
                }
            });

            // Handle URL input
            urlInput.addEventListener('input', () => {
                const url = urlInput.value.trim();
                if (url) {
                    preview.style.backgroundImage = `url("${url}")`;
                    preview.innerHTML = '';
                    fileUpload.value = null; // Clear file input if URL is used
                } else {
                    preview.style.backgroundImage = 'none';
                    preview.innerHTML = '<span>预览</span>';
                }
            });

            // Handle file upload
            fileUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const compressedUrl = await compressImage(file, { quality: 0.8, maxWidth: 200, maxHeight: 200 });
                        preview.style.backgroundImage = `url("${compressedUrl}")`;
                        preview.innerHTML = '';
                        urlInput.value = ''; // Clear URL input if file is used
                    } catch (error) {
                        showToast('图片压缩失败，请重试');
                        preview.style.backgroundImage = 'none';
                        preview.innerHTML = '<span>预览</span>';
                    }
                }
            });

            // Handle form submission
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const targetAvatar = targetInput.value;
                const bgImage = preview.style.backgroundImage;
                const newSrc = bgImage.slice(5, -2); // Extract URL from 'url("...")'

                if (!targetAvatar || !newSrc) {
                    showToast('没有要保存的图片');
                    return;
                }

                if (targetAvatar === 'centralCircle') {
                    db.homeWidgetSettings.centralCircleImage = newSrc;
                } else if (targetAvatar === 'avatar1') {
                    db.insWidgetSettings.avatar1 = newSrc;
                } else if (targetAvatar === 'avatar2') {
                    db.insWidgetSettings.avatar2 = newSrc;
                }

                await saveData();
                setupHomeScreen(); // Re-render the home screen to show the new avatar
                modal.classList.remove('visible');
                showToast('头像已更新');
            });
        }

       function updatePolaroidImage(imageUrl) {
           const styleId = 'polaroid-image-style';
           let styleElement = document.getElementById(styleId);
           if (!styleElement) {
               styleElement = document.createElement('style');
               styleElement.id = styleId;
               document.head.appendChild(styleElement);
           }
           styleElement.innerHTML = `
               .heart-photo-widget::after {
                   background-image: url('${imageUrl}');
               }
           `;
       }

       function setupHeartPhotoModal() {
           const widget = document.querySelector('.heart-photo-widget');
           const modal = document.getElementById('heart-photo-modal');
           const form = document.getElementById('heart-photo-form');
           const preview = document.getElementById('heart-photo-preview');
           const urlInput = document.getElementById('heart-photo-url-input');
           const fileUpload = document.getElementById('heart-photo-file-upload');

           if (!widget || !modal || !form) return;

           // 1. Open modal on widget click/tap
           const openModalAction = () => {
               const currentImage = db.homeWidgetSettings?.polaroidImage || 'https://i.postimg.cc/XvFDdTKY/Smart-Select-20251013-023208.jpg';
               preview.style.backgroundImage = `url("${currentImage}")`;
               preview.innerHTML = '';
               urlInput.value = '';
               fileUpload.value = null;
               modal.classList.add('visible');
           };

           widget.addEventListener('click', openModalAction);
           widget.addEventListener('touchend', (e) => {
               e.preventDefault();
               openModalAction();
           });

           // 2. Handle image preview (URL input)
           urlInput.addEventListener('input', () => {
               const url = urlInput.value.trim();
               if (url) {
                   preview.style.backgroundImage = `url("${url}")`;
                   preview.innerHTML = '';
                   fileUpload.value = null; // Clear file input
               } else {
                   preview.style.backgroundImage = 'none';
                   preview.innerHTML = '<span>预览</span>';
               }
           });

           // 3. Handle image preview (File upload)
           fileUpload.addEventListener('change', async (e) => {
               const file = e.target.files[0];
               if (file) {
                   try {
                       const compressedUrl = await compressImage(file, { quality: 0.8, maxWidth: 400, maxHeight: 400 });
                       preview.style.backgroundImage = `url("${compressedUrl}")`;
                       preview.innerHTML = '';
                       urlInput.value = ''; // Clear URL input
                   } catch (error) {
                       showToast('图片压缩失败，请重试');
                       preview.style.backgroundImage = 'none';
                       preview.innerHTML = '<span>预览</span>';
                   }
               }
           });

           // 4. Handle form submission
           form.addEventListener('submit', async (e) => {
               e.preventDefault();
               const bgImage = preview.style.backgroundImage;
               const newSrc = bgImage.slice(5, -2); // Extract URL from 'url("...")'

               if (!newSrc) {
                   showToast('没有要保存的图片');
                   return;
               }

               // Ensure homeWidgetSettings exists
               if (!db.homeWidgetSettings) {
                   db.homeWidgetSettings = JSON.parse(JSON.stringify(defaultWidgetSettings));
               }
               db.homeWidgetSettings.polaroidImage = newSrc;

               await saveData();
               
               updatePolaroidImage(newSrc);

               modal.classList.remove('visible');
               showToast('拍立得照片已更新');
           });
       }

        function setupPomodoroSettings() {
            const settingsBtn = document.getElementById('pomodoro-focus-settings-btn');
            const settingsSidebar = document.getElementById('pomodoro-settings-sidebar');
            const settingsForm = document.getElementById('pomodoro-settings-form');
            const focusBgUpload = document.getElementById('pomodoro-focus-bg-upload');
            const taskCardBgUpload = document.getElementById('pomodoro-task-card-bg-upload');

            settingsBtn?.addEventListener('click', () => {
                if (currentPomodoroTask) {
                    currentPomodoroSettingsContext = currentPomodoroTask.settings;
                    loadSettingsToPomodoroSidebar(currentPomodoroSettingsContext);
                    settingsSidebar.classList.add('open');
                } else {
                    showToast('没有正在进行的专注任务');
                }
            });

            settingsForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (currentPomodoroSettingsContext) {
                    await savePomodoroSettingsFromSidebar(currentPomodoroSettingsContext);
                }
                settingsSidebar.classList.remove('open');
            });

            focusBgUpload?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file && currentPomodoroSettingsContext) {
                    try {
                        const compressedUrl = await compressImage(file, { quality: 0.85, maxWidth: 1080, maxHeight: 1920 });
                        document.getElementById('pomodoro-focus-bg-url').value = compressedUrl;
                        currentPomodoroSettingsContext.focusBackground = compressedUrl;
                        applyPomodoroBackgrounds();
                        showToast('专注背景已更新，请保存设置');
                    } catch (error) {
                        showToast('背景压缩失败');
                    }
                }
            });

            taskCardBgUpload?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file && currentPomodoroSettingsContext) {
                    try {
                        const compressedUrl = await compressImage(file, { quality: 0.8, maxWidth: 800, maxHeight: 800 });
                        // 将上传的图片URL保存到当前任务的独立设置中
                        currentPomodoroSettingsContext.taskCardBackground = compressedUrl;
                        // 同时更新输入框的值，以便保存时能正确写入
                        document.getElementById('pomodoro-task-card-bg-url').value = compressedUrl;
                        showToast('卡片背景已更新，请保存设置');
                    } catch (error) {
                        showToast('背景压缩失败');
                    }
                }
            });
        }

        function loadSettingsToPomodoroSidebar(settings) {
            const charSelect = document.getElementById('pomodoro-char-select');
            const userPersonaSelect = document.getElementById('pomodoro-user-persona-select');

            charSelect.innerHTML = '<option value="">不绑定</option>';
            db.characters.forEach(char => {
                const option = document.createElement('option');
                option.value = char.id;
                option.textContent = char.remarkName;
                if (settings.boundCharId === char.id) {
                    option.selected = true;
                }
                charSelect.appendChild(option);
            });

            userPersonaSelect.innerHTML = '<option value="">默认</option>';
            (db.myPersonaPresets || []).forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.name;
                option.textContent = preset.name;
                if (settings.userPersona === preset.name) {
                    option.selected = true;
                }
                userPersonaSelect.appendChild(option);
            });

            document.getElementById('pomodoro-encouragement-minutes').value = settings.encouragementMinutes || 25;
            document.getElementById('pomodoro-poke-limit').value = settings.pokeLimit || 5;
            document.getElementById('pomodoro-focus-bg-url').value = settings.focusBackground || '';
            document.getElementById('pomodoro-task-card-bg-url').value = settings.taskCardBackground || '';
        }

        async function savePomodoroSettingsFromSidebar(settings) {
            const oldCharId = settings.boundCharId;
            const newCharId = document.getElementById('pomodoro-char-select').value;

            settings.boundCharId = newCharId;
            settings.userPersona = document.getElementById('pomodoro-user-persona-select').value;
            settings.encouragementMinutes = parseInt(document.getElementById('pomodoro-encouragement-minutes').value, 10) || 25;
            settings.pokeLimit = parseInt(document.getElementById('pomodoro-poke-limit').value, 10) || 5;
            settings.focusBackground = document.getElementById('pomodoro-focus-bg-url').value.trim();
            settings.taskCardBackground = document.getElementById('pomodoro-task-card-bg-url').value.trim();
            
            await saveData();
            applyPomodoroBackgrounds();

            // Update avatar in focus screen if it's active
            const focusAvatarEl = document.querySelector('#pomodoro-focus-screen .focus-avatar');
            if (settings.boundCharId) {
                const boundChar = db.characters.find(c => c.id === settings.boundCharId);
                if (boundChar && focusAvatarEl) {
                    focusAvatarEl.src = boundChar.avatar;
                }
            } else if (focusAvatarEl) {
                focusAvatarEl.src = 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg'; // Fallback
            }

            // 新增：如果更换了角色，则清空对话框
            if (oldCharId !== newCharId) {
                const focusMessageBubble = document.querySelector('#pomodoro-focus-screen .focus-message-bubble');
                if (focusMessageBubble) {
                    focusMessageBubble.classList.remove('visible');
                    focusMessageBubble.querySelector('p').textContent = '';
                }
            }

            showToast('专注设置已保存');
        }

        function applyPomodoroBackgrounds() {
            const focusScreen = document.getElementById('pomodoro-focus-screen');
            
            // Apply focus screen background from the CURRENT task if it exists
            if (currentPomodoroTask && currentPomodoroTask.settings.focusBackground) {
                focusScreen.style.backgroundImage = `url(${currentPomodoroTask.settings.focusBackground})`;
                focusScreen.style.backgroundSize = 'cover';
                focusScreen.style.backgroundPosition = 'center';
            } else {
                focusScreen.style.backgroundImage = 'none';
            }

        }

        function setupPomodoroGlobalSettings() {
            const settingsBtn = document.getElementById('pomodoro-settings-btn');
            const sidebar = document.getElementById('pomodoro-global-settings-sidebar');
            const linkBtn = document.getElementById('link-global-pomodoro-world-book-btn');
            const modal = document.getElementById('global-pomodoro-world-book-selection-modal');
            const selectionList = document.getElementById('global-pomodoro-world-book-selection-list');
            const saveBtn = document.getElementById('save-global-pomodoro-world-book-selection-btn');

            settingsBtn?.addEventListener('click', () => {
                sidebar.classList.add('open');
            });

            linkBtn?.addEventListener('click', () => {
                if (!db.pomodoroSettings) {
                    db.pomodoroSettings = { globalWorldBookIds: [] };
                }
                const selectedIds = db.pomodoroSettings.globalWorldBookIds || [];
                renderCategorizedWorldBookList(selectionList, db.worldBooks, selectedIds, 'global-pomodoro-wb-select');
                modal.classList.add('visible');
            });

            saveBtn?.addEventListener('click', async () => {
                const selectedIds = Array.from(selectionList.querySelectorAll('.item-checkbox:checked')).map(input => input.value);
                if (!db.pomodoroSettings) {
                    db.pomodoroSettings = {};
                }
                db.pomodoroSettings.globalWorldBookIds = selectedIds;
                await saveData();
                modal.classList.remove('visible');
                showToast('全局专注世界书已更新');
            });
        }

        function setupMemoryJournalScreen() {
            const generateNewJournalBtn = document.getElementById('generate-new-journal-btn');
            const generateJournalModal = document.getElementById('generate-journal-modal');
            const generateJournalForm = document.getElementById('generate-journal-form');
            const journalListContainer = document.getElementById('journal-list-container');
            const editDetailBtn = document.getElementById('edit-journal-detail-btn');
            const bindWorldBookBtn = document.getElementById('bind-journal-worldbook-btn');
            const journalWorldBookModal = document.getElementById('journal-worldbook-selection-modal');
            const journalWorldBookList = document.getElementById('journal-worldbook-selection-list');
            const saveJournalWorldBookBtn = document.getElementById('save-journal-worldbook-selection-btn');

            // 新增：绑定世界书按钮事件
            bindWorldBookBtn.addEventListener('click', () => {
                const character = db.characters.find(c => c.id === currentChatId);
                if (!character) return;
                renderCategorizedWorldBookList(journalWorldBookList, db.worldBooks, character.journalWorldBookIds || [], 'journal-wb-select');
                journalWorldBookModal.classList.add('visible');
            });

            // 新增：保存世界书绑定
            saveJournalWorldBookBtn.addEventListener('click', async () => {
                const character = db.characters.find(c => c.id === currentChatId);
                if (!character) return;

                const selectedIds = Array.from(journalWorldBookList.querySelectorAll('.item-checkbox:checked')).map(input => input.value);
                character.journalWorldBookIds = selectedIds;
                await saveData();
                journalWorldBookModal.classList.remove('visible');
                showToast('日记绑定的世界书已更新');
            });

             // "生成新日记" 按钮 -> 弹出范围选择模态框
            generateNewJournalBtn.addEventListener('click', () => {
                const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
                const totalMessages = chat ? chat.history.length : 0;
                
                const rangeInfo = document.getElementById('journal-range-info');
                rangeInfo.textContent = `当前聊天总消息数: ${totalMessages}`;

                generateJournalForm.reset();
                generateJournalModal.classList.add('visible');
            });

            // 范围选择表单提交
            generateJournalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const startInput = document.getElementById('journal-range-start');
                const endInput = document.getElementById('journal-range-end');

                const start = parseInt(startInput.value);
                const end = parseInt(endInput.value);
                
                if (isNaN(start) || isNaN(end) || start <= 0 || end < start) {
                    showToast('请输入有效的起止范围');
                    return;
                }

                generateJournalModal.classList.remove('visible');
                await generateJournal(start, end);
            });

            // 点击列表容器中的项目 (事件委托)
            journalListContainer.addEventListener('click', async (e) => {
                const target = e.target;
                const card = target.closest('.journal-card');
                if (!card) return;

                const journalId = card.dataset.id;
                const character = db.characters.find(c => c.id === currentChatId);
                if (!character) return;
                const journal = character.memoryJournals.find(j => j.id === journalId);
                if (!journal) return;

                // --- Handle Action Buttons ---
                if (target.closest('.delete-journal-btn')) {
                    if (confirm('确定要删除这篇日记吗？')) {
                        character.memoryJournals = character.memoryJournals.filter(j => j.id !== journalId);
                        await saveData();
                        renderJournalList();
                        showToast('日记已删除');
                    }
                    return;
                }

                if (target.closest('.favorite-journal-btn')) {
                    journal.isFavorited = !journal.isFavorited;
                    await saveData();
                    target.closest('.favorite-journal-btn').classList.toggle('favorited', journal.isFavorited);
                    showToast(journal.isFavorited ? '已收藏' : '已取消收藏');
                    return;
                }
                
                // --- Handle Navigation to Detail Screen ---
                const date = new Date(journal.createdAt);
                const formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
                
                currentJournalDetailId = journal.id;

                const titleEl = document.getElementById('journal-detail-title');
                const contentEl = document.getElementById('journal-detail-content');

                titleEl.isContentEditable = false;
                contentEl.isContentEditable = false;
                titleEl.style.border = 'none';
                contentEl.style.border = 'none';
                titleEl.style.padding = '0';
                contentEl.style.padding = '0';
                editDetailBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z" /></svg>`;

                titleEl.textContent = journal.title;
                document.getElementById('journal-detail-meta').textContent = `创建于 ${formattedDate} | 消息范围: ${journal.range.start}-${journal.range.end}`;
                document.getElementById('journal-detail-content').textContent = journal.content;
                
                switchScreen('memory-journal-detail-screen');
            });

            // --- NEW: Event listener for the detail page edit button ---
            editDetailBtn.addEventListener('click', async () => {
                if (!currentJournalDetailId) return;

                const titleEl = document.getElementById('journal-detail-title');
                const contentEl = document.getElementById('journal-detail-content');
                const isEditing = titleEl.isContentEditable;

                if (isEditing) {
                    // --- SAVE LOGIC ---
                    const character = db.characters.find(c => c.id === currentChatId);
                    if (!character) return;
                    const journal = character.memoryJournals.find(j => j.id === currentJournalDetailId);
                    if (!journal) return;

                    journal.title = titleEl.textContent.trim();
                    journal.content = contentEl.textContent.trim();
                    await saveData();

                    titleEl.isContentEditable = false;
                    contentEl.isContentEditable = false;
                    titleEl.style.border = 'none';
                    contentEl.style.border = 'none';
                    titleEl.style.padding = '0';
                    contentEl.style.padding = '0';
                    editDetailBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z" /></svg>`;
                    showToast('日记已保存');
                    renderJournalList(); // Re-render list to show updated title if changed
                } else {
                    // --- EDIT LOGIC ---
                    titleEl.setAttribute('contenteditable', 'true');
                    contentEl.setAttribute('contenteditable', 'true');
                    titleEl.style.border = '1px dashed #ccc';
                    titleEl.style.padding = '5px';
                    contentEl.style.border = '1px dashed #ccc';
                    contentEl.style.padding = '10px';
                    editDetailBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z" /></svg>`; // Checkmark icon
                    titleEl.focus();
                }
            });
        }

        function renderJournalList() {
            const container = document.getElementById('journal-list-container');
            const placeholder = document.getElementById('no-journals-placeholder');
            container.innerHTML = '';

            const character = db.characters.find(c => c.id === currentChatId);
            const journals = character ? character.memoryJournals : [];

            if (!journals || journals.length === 0) {
                placeholder.style.display = 'block';
                return;
            }

            placeholder.style.display = 'none';

            const sortedJournals = [...journals].sort((a, b) => a.createdAt - b.createdAt);

            sortedJournals.forEach(journal => {
                const card = document.createElement('li');
                card.className = 'journal-card';
                card.dataset.id = journal.id;

                const date = new Date(journal.createdAt);
                const formattedDate = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

                card.innerHTML = `
                    <div class="journal-card-header">
                        <div class="journal-card-title">${journal.title}</div>
                    </div>
                    <div class="journal-card-actions">
                        <button class="action-icon-btn favorite-journal-btn" title="收藏">
                            <svg viewBox="0 0 24 24">
                                <path class="star-outline" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" fill="currentColor"/>
                                <path class="star-solid" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
                            </svg>
                        </button>
                        <button class="action-icon-btn delete-journal-btn" title="删除">
                            <svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>
                        </button>
                    </div>
                    <div class="journal-card-footer" style="justify-content: space-between; height: auto; opacity: 1; margin-top: 10px;">
                        <span class="journal-card-date">${formattedDate}</span>
                        <span class="journal-card-range">范围: ${journal.range.start}-${journal.range.end}</span>
                    </div>
                `;

                if (journal.isFavorited) {
                    card.querySelector('.favorite-journal-btn').classList.add('favorited');
                }

                container.appendChild(card);
            });

            // 为相册刷新按钮添加事件监听
            const refreshAlbumBtn = document.getElementById('refresh-album-btn');
            if(refreshAlbumBtn) {
                refreshAlbumBtn.addEventListener('click', () => generateAndRenderPeekContent('album', { forceRefresh: true }));
            }
    
            // 为照片详情模态框添加关闭事件
            const photoModal = document.getElementById('peek-photo-modal');
            if(photoModal) {
                photoModal.addEventListener('click', (e) => {
                    if (e.target === photoModal) {
                        photoModal.classList.remove('visible');
                    }
                });
            }
        }

        async function generateJournal(start, end) {
            showToast('正在生成日记，请稍候...');
            isGenerating = true; // Set a flag to prevent other actions

            try {
                const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
                if (!chat) {
                    throw new Error("未找到当前聊天。");
                }

                // Message indices are 1-based for the user, so convert to 0-based for slicing
                const startIndex = start - 1;
                const endIndex = end;
                
                if (startIndex < 0 || endIndex > chat.history.length || startIndex >= endIndex) {
                    throw new Error("无效的消息范围。");
                }

                const messagesToSummarize = chat.history.slice(startIndex, endIndex);
                
                // 使用为日记绑定的世界书
                const journalWorldBooks = (chat.journalWorldBookIds || []).map(id => db.worldBooks.find(wb => wb.id === id)).filter(Boolean);
                const worldBooksContent = journalWorldBooks.map(book => {
                    if (Array.isArray(book.content)) {
                        // (This handles the new format)
                        return book.content.map(entry => entry.content || '').join('\n');
                    }
                    // (This handles old string-based content for compatibility)
                    return book.content || '';
                }).join('\n\n');

                let summaryPrompt = `你是一个日记整理助手。请以角色 "${chat.remarkName || chat.name}" 的第一人称视角，总结以下聊天记录。请专注于重要的情绪、事件和细节。\n\n`;
                summaryPrompt += "为了更好地理解角色和背景，请参考以下信息：\n";
                summaryPrompt += "=====\n";

                if (worldBooksContent) {
                    summaryPrompt += `世界观设定:\n${worldBooksContent}\n\n`;
                }

                summaryPrompt += `你的角色设定:\n- 角色名: ${chat.realName}\n- 人设: ${chat.persona || "一个友好、乐于助人的伙伴。"}\n\n`;
                summaryPrompt += `我的角色设定:\n- 我的称呼: ${chat.myName}\n- 我的人设: ${chat.myPersona || "无特定人设。"}\n\n`;
                summaryPrompt += "=====\n";
                summaryPrompt += `请基于以上所有背景信息，总结以下聊天记录。你的输出必须是一个JSON对象，包含 'title' (一个简洁的标题) 和 'content' (完整的日记正文) 两个字段。聊天记录如下：\n\n---\n${messagesToSummarize.map(m => m.content).join('\n')}\n---`;

                const { url, key, model } = db.apiSettings;
                if (!url || !key || !model) {
                    throw new Error("API设置不完整。");
                }

                const requestBody = {
                    model: model,
                    messages: [{ role: 'user', content: summaryPrompt }],
                    temperature: 0.7,
                    response_format: { type: "json_object" }, // Request JSON output
                };
                const endpoint = `${url}/v1/chat/completions`;
                const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };

                const response = await fetch(endpoint, { method: 'POST', headers: headers, body: JSON.stringify(requestBody) });
                if (!response.ok) {
                    const error = new Error(`API 错误: ${response.status} ${await response.text()}`);
                    error.response = response;
                    throw error;
                }

                const result = await response.json();
                const rawContent = result.choices[0].message.content;
                const journalData = JSON.parse(rawContent);

                // Create and save the new journal entry
                const newJournal = {
                    id: `journal_${Date.now()}`,
                    range: { start, end },
                    title: journalData.title || "无标题日记",
                    content: journalData.content || "内容为空。",
                    createdAt: Date.now(),
                    chatId: currentChatId,
                    chatType: currentChatType,
                    isFavorited: false // 新增：收藏状态
                };

                if (!chat.memoryJournals) {
                    chat.memoryJournals = [];
                }
                chat.memoryJournals.push(newJournal);
                await saveData();

                renderJournalList();
                showToast('新日记已生成！');

            } catch (error) {
                showApiError(error);
            } finally {
                isGenerating = false; // Reset the flag
            }
        }

        function setupPeekFeature() {
            // const peekBtn = document.getElementById('peek-btn'); // <-- 已在 setupChatRoom() 中删除，此处无需操作
            // const peekConfirmModal = document.getElementById('peek-confirm-modal'); // <-- 删除
            // const peekConfirmYes = document.getElementById('peek-confirm-yes'); // <-- 删除
            // const peekConfirmNo = document.getElementById('peek-confirm-no'); // <-- 删除
            const peekSettingsBtn = document.getElementById('peek-settings-btn');
            const peekWallpaperModal = document.getElementById('peek-wallpaper-modal');
            const peekWallpaperForm = document.getElementById('peek-wallpaper-form');
            const peekWallpaperUpload = document.getElementById('peek-wallpaper-upload');
            const peekWallpaperPreview = document.getElementById('peek-wallpaper-preview');

            // peekBtn?.addEventListener('click', () => { // <-- 已在 setupChatRoom() 中删除
            //     peekConfirmModal.classList.add('visible');
            // });

            // peekConfirmNo?.addEventListener('click', () => { // <-- 删除
            //     peekConfirmModal.classList.remove('visible'); // <-- 删除
            // }); // <-- 删除

            // peekConfirmYes?.addEventListener('click', () => { // <-- 删除
            //     peekConfirmModal.classList.remove('visible'); // <-- 删除
            //     peekContentCache = {}; // Clear cache for new session // <-- 删除
            //     renderPeekScreen(); // Render before switching // <-- 删除
            //     switchScreen('peek-screen'); // <-- 删除
            // }); // <-- 删除

            // New simplified settings functionality
            peekSettingsBtn?.addEventListener('click', () => {
                renderPeekSettings();
                peekWallpaperModal.classList.add('visible');
            });

            peekWallpaperUpload?.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const compressedUrl = await compressImage(file, { quality: 0.85, maxWidth: 1080, maxHeight: 1920 });
                        document.getElementById('peek-wallpaper-url-input').value = compressedUrl;
                        showToast('图片已压缩并填入URL输入框');
                    } catch (error) {
                        showToast('壁纸压缩失败，请重试');
                    }
                }
            });

            // Combined save button for all peek settings
            document.getElementById('save-peek-settings-btn')?.addEventListener('click', async () => {
                const character = db.characters.find(c => c.id === currentChatId);
                if (!character) {
                    showToast('错误：未找到当前角色');
                    return;
                }

                if (!character.peekScreenSettings) {
                    character.peekScreenSettings = { wallpaper: '', customIcons: {}, unlockAvatar: '' };
                }

                // Save wallpaper
                character.peekScreenSettings.wallpaper = document.getElementById('peek-wallpaper-url-input').value.trim();

                // Save custom app icons
                const iconInputs = document.querySelectorAll('#peek-app-icons-settings input[type="url"]');
                iconInputs.forEach(input => {
                    const appId = input.dataset.appId;
                    const newUrl = input.value.trim();
                    if (newUrl) {
                        if (!character.peekScreenSettings.customIcons) {
                            character.peekScreenSettings.customIcons = {};
                        }
                        character.peekScreenSettings.customIcons[appId] = newUrl;
                    } else {
                        if (character.peekScreenSettings.customIcons) {
                            delete character.peekScreenSettings.customIcons[appId];
                        }
                    }
                });
                
                // Save unlock avatar
                character.peekScreenSettings.unlockAvatar = document.getElementById('peek-unlock-avatar-url').value.trim();

                await saveData();
                renderPeekScreen(); // Re-render to apply all changes
                showToast('已保存！');
                peekWallpaperModal.classList.remove('visible');
            });

            // Add collapsible functionality
            peekWallpaperModal.addEventListener('click', (e) => {
                const header = e.target.closest('.collapsible-header');
                if (header) {
                    header.parentElement.classList.toggle('open');
                }
            });

            const peekMessagesScreen = document.getElementById('peek-messages-screen');
            peekMessagesScreen.addEventListener('click', (e) => {
                const chatItem = e.target.closest('.chat-item');
                if (chatItem) {
                    const partnerName = chatItem.dataset.name;
                    const cachedData = peekContentCache.messages;
                    if (cachedData && cachedData.conversations) {
                        const conversation = cachedData.conversations.find(c => c.partnerName === partnerName);
                        if (conversation) {
                            renderPeekConversation(conversation.history, conversation.partnerName);
                            switchScreen('peek-conversation-screen');
                        } else {
                            showToast('找不到对话记录');
                        }
                    }
                } else if (e.target.closest('.action-btn')) {
                    generateAndRenderPeekContent('messages', { forceRefresh: true });
                }
            });

            const peekConversationScreen = document.getElementById('peek-conversation-screen');
            peekConversationScreen.addEventListener('click', (e) => {
                if (e.target.closest('.action-btn')) {
                    generateAndRenderPeekContent('messages', { forceRefresh: true });
                }
            });

            // 为相册刷新按钮添加事件监听
            const refreshAlbumBtn = document.getElementById('refresh-album-btn');
            if(refreshAlbumBtn) {
                refreshAlbumBtn.addEventListener('click', () => generateAndRenderPeekContent('album', { forceRefresh: true }));
            }
    
            // 为照片详情模态框添加关闭事件
            const photoModal = document.getElementById('peek-photo-modal');
            if(photoModal) {
                photoModal.addEventListener('click', (e) => {
                    if (e.target === photoModal) {
                        photoModal.classList.remove('visible');
                    }
                });
            }
        } // setupPeekFeature() 函数的结束括号

        /**
         * 渲染"选择查看对象"列表
         * (只显示私聊角色，按名称排序)
         */
        function renderPeekCharacterSelectScreen() {
            const listContainer = document.getElementById('peek-select-list-container');
            const placeholder = document.getElementById('no-peek-characters-placeholder');
            if (!listContainer || !placeholder) return;

            listContainer.innerHTML = '';

            // 1. 筛选私聊角色
            const characters = db.characters.filter(c => c.id.startsWith('char_'));

            // 2. 按名称排序
            characters.sort((a, b) => a.remarkName.localeCompare(b.remarkName));

            if (characters.length === 0) {
                placeholder.style.display = 'block';
                listContainer.style.display = 'none';
                return;
            }

            placeholder.style.display = 'none';
            listContainer.style.display = 'block';

            // 3. 渲染简化版列表
            characters.forEach(char => {
                const li = document.createElement('li');
                li.className = 'list-item'; // 复用基础列表项样式
                li.dataset.id = char.id; // 存储角色ID

                li.innerHTML = `
                    <img src="${char.avatar}" alt="${char.remarkName}" class="chat-avatar">
                    <div class="item-details">
                        <div class="item-name">${DOMPurify.sanitize(char.remarkName)}</div>
                    </div>
                `;
                listContainer.appendChild(li);
            });
        }

        /**
         * 为"选择查看对象"列表绑定事件
         */
        function setupPeekCharacterSelectScreen() {
            const listContainer = document.getElementById('peek-select-list-container');
            if (!listContainer) return;

            listContainer.addEventListener('click', (e) => {
                const charItem = e.target.closest('.list-item[data-id]');
                if (charItem) {
                    const charId = charItem.dataset.id;

                    // 1. 设置当前要查看的角色ID
                    currentChatId = charId;
                    currentChatType = 'private'; // 偷看功能只支持私聊

                    // 2. 清空缓存，渲染并跳转
                    peekContentCache = {}; // Clear cache for new session
                    renderPeekScreen(); // 渲染偷看主页
                    switchScreen('peek-screen');
                }
            });
        }

        function renderPeekAlbum(photos) {
            const screen = document.getElementById('peek-album-screen');
            const grid = screen.querySelector('.album-grid');
            grid.innerHTML = ''; // Clear previous content
    
            if (!photos || photos.length === 0) {
                grid.innerHTML = '<p class="placeholder-text">正在生成相册内容...</p>';
                return;
            }
    
            photos.forEach(photo => {
                const photoEl = document.createElement('div');
                photoEl.className = 'album-photo';
                photoEl.dataset.imageDescription = photo.imageDescription;
                photoEl.dataset.description = photo.description;
    
                const img = document.createElement('img');
                img.src = 'https://i.postimg.cc/1tH6ds9g/1752301200490.jpg'; // 使用一个静态占位图
                img.alt = "相册照片";
                photoEl.appendChild(img);
    
                if (photo.type === 'video') {
                    const videoIndicator = document.createElement('div');
                    videoIndicator.className = 'video-indicator';
                    videoIndicator.innerHTML = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`;
                    photoEl.appendChild(videoIndicator);
                }
                
                photoEl.addEventListener('click', () => {
                    const modal = document.getElementById('peek-photo-modal');
                    const imgContainer = document.getElementById('peek-photo-image-container');
                    const descriptionEl = document.getElementById('peek-photo-description');
                    
                    // 将AI生成的图片文字描述展示出来，而不是真的图片
                    imgContainer.innerHTML = `<div style="padding: 20px; text-align: left; color: #555; font-size: 16px; line-height: 1.6; height: 100%; overflow-y: auto;">${photo.imageDescription}</div>`;
                    // 显示角色对照片的批注
                    descriptionEl.textContent = `批注：${photo.description}`;
                    
                    modal.classList.add('visible');
                });
    
                grid.appendChild(photoEl);
            });
        }

        function renderPeekUnlock(data) {
            const screen = document.getElementById('peek-unlock-screen');
            if (!screen) return;

            // Handle loading/empty state
            if (!data) {
                screen.innerHTML = `
                    <header class="app-header">
                        <button class="back-btn" data-target="peek-screen">‹</button>
                        <div class="title-container"><h1 class="title">...</h1></div>
                        <button class="action-btn">···</button>
                    </header>
                    <main class="content"><p class="placeholder-text">正在生成小号内容...</p></main>
                `;
                return;
            }

            const { nickname, handle, bio, posts } = data;
            const character = db.characters.find(c => c.id === currentChatId);
            const peekSettings = character?.peekScreenSettings || { unlockAvatar: '' };
            const fixedAvatar = peekSettings.unlockAvatar || 'https://i.postimg.cc/SNwL1XwR/chan-11.png';

            // Random numbers for stats
            const randomFollowers = (Math.random() * 5 + 1).toFixed(1) + 'k';
            const randomFollowing = Math.floor(Math.random() * 500) + 50;

            let postsHtml = '';
            if (posts && posts.length > 0) {
                posts.forEach(post => {
                    const randomComments = Math.floor(Math.random() * 100);
                    const randomLikes = Math.floor(Math.random() * 500);
                    postsHtml += `
                        <div class="unlock-post-card">
                            <div class="unlock-post-card-header">
                                <img src="${fixedAvatar}" alt="Profile Avatar">
                                <div class="unlock-post-card-author-info">
                                    <span class="username">${nickname}</span>
                                    <span class="timestamp">${post.timestamp}</span>
                                </div>
                            </div>
                            <div class="unlock-post-card-content">
                                ${post.content.replace(/\n/g, '<br>')}
                            </div>
                            <div class="unlock-post-card-actions">
                                <div class="action"><svg viewBox="0 0 24 24"><path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L16.04,7.15C16.56,7.62 17.24,7.92 18,7.92C19.66,7.92 21,6.58 21,5C21,3.42 19.66,2 18,2C16.34,2 15,3.42 15,5C15,5.24 15.04,5.47 15.09,5.7L7.96,9.85C7.44,9.38 6.76,9.08 6,9.08C4.34,9.08 3,10.42 3,12C3,13.58 4.34,14.92 6,14.92C6.76,14.92 7.44,14.62 7.96,14.15L15.09,18.3C15.04,18.53 15,18.76 15,19C15,20.58 16.34,22 18,22C19.66,22 21,20.58 21,19C21,17.42 19.66,16.08 18,16.08Z"></path></svg> <span>分享</span></div>
                                <div class="action"><svg viewBox="0 0 24 24"><path d="M20,2H4C2.9,0,2,0.9,2,2v18l4-4h14c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M18,14H6v-2h12V14z M18,11H6V9h12V11z M18,8H6V6h12V8z"></path></svg> <span>${randomComments}</span></div>
                                <div class="action"><svg viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36,2,12.27,2,8.5C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z"></path></svg> <span>${randomLikes}</span></div>
                            </div>
                        </div>
                    `;
                });
            }

            screen.innerHTML = `
                <header class="app-header">
                    <button class="back-btn" data-target="peek-screen">‹</button>
                    <div class="title-container">
                        <h1 class="title">${nickname}</h1>
                    </div>
                    <button class="action-btn" id="refresh-unlock-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg></button>
                </header>
                <main class="content">
                    <div class="unlock-profile-header">
                        <img src="${fixedAvatar}" alt="Profile Avatar" class="unlock-profile-avatar">
                        <div class="unlock-profile-info">
                            <h2 class="unlock-profile-username">${nickname}</h2>
                            <p class="unlock-profile-handle">${handle}</p>
                        </div>
                    </div>
                    <div class="unlock-profile-bio">
                        <p>${bio.replace(/\n/g, '<br>')}</p>
                    </div>
                    <div class="unlock-profile-stats">
                        <div class="unlock-profile-stat">
                            <span class="count">${posts.length}</span>
                            <span class="label">帖子</span>
                        </div>
                        <div class="unlock-profile-stat">
                            <span class="count">${randomFollowers}</span>
                            <span class="label">粉丝</span>
                        </div>
                        <div class="unlock-profile-stat">
                            <span class="count">${randomFollowing}</span>
                            <span class="label">关注</span>
                        </div>
                    </div>
                    <div class="unlock-post-feed">
                        ${postsHtml}
                    </div>
                </main>
            `;

            // Add event listener for the new refresh button
            screen.querySelector('#refresh-unlock-btn').addEventListener('click', () => {
                generateAndRenderPeekContent('unlock', { forceRefresh: true });
            });
        }
 
        function renderPeekConversation(history, partnerName) {
            const titleEl = document.getElementById('peek-conversation-title');
            const messageAreaEl = document.getElementById('peek-message-area');

            titleEl.textContent = partnerName;
            messageAreaEl.innerHTML = '';

            if (!history || history.length === 0) {
                messageAreaEl.innerHTML = '<p class="placeholder-text">正在生成对话...</p>';
                return;
            }

            history.forEach(msg => {
                const isSentByChar = msg.sender === 'char'; // 'char' is the character whose phone we are peeking
                const wrapper = document.createElement('div');
                wrapper.className = `message-wrapper ${isSentByChar ? 'sent' : 'received'}`;

                const bubbleRow = document.createElement('div');
                bubbleRow.className = 'message-bubble-row';

                const bubble = document.createElement('div');
                bubble.className = `message-bubble ${isSentByChar ? 'sent' : 'received'}`;
                bubble.textContent = msg.content;

                if (isSentByChar) {
                    bubbleRow.appendChild(bubble);
                } else {
                    const avatar = document.createElement('img');
                    avatar.className = 'message-avatar';
                    avatar.src = 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg';
                    bubbleRow.appendChild(avatar);
                    bubbleRow.appendChild(bubble);
                }
                
                wrapper.appendChild(bubbleRow);
                messageAreaEl.appendChild(wrapper);
            });
            messageAreaEl.scrollTop = messageAreaEl.scrollHeight;
        }

        function renderPeekScreen() {
            const peekScreen = document.getElementById('peek-screen');
            const contentArea = peekScreen.querySelector('main.content');

            // Set content
            contentArea.innerHTML = `
                <div class="time-widget">
                    <div class="time" id="peek-time-display"></div>
                    <div class="date" id="peek-date-display"></div>
                </div>
                <div class="app-grid"></div>
            `;

            const character = db.characters.find(c => c.id === currentChatId);
            const peekSettings = character?.peekScreenSettings || { wallpaper: '', customIcons: {} };

            // Apply wallpaper to the parent screen element
            const wallpaper = peekSettings.wallpaper;
            if (wallpaper) {
                peekScreen.style.backgroundImage = `url(${wallpaper})`;
            } else {
                peekScreen.style.backgroundImage = `url(${db.wallpaper})`; // Fallback to global wallpaper
            }
            peekScreen.style.backgroundSize = 'cover';
            peekScreen.style.backgroundPosition = 'center';

            // Render the 6 specific, non-functional icons
            const appGrid = contentArea.querySelector('.app-grid');
            Object.keys(peekScreenApps).forEach(id => {
                const iconData = peekScreenApps[id];
                const iconEl = document.createElement('a');
                iconEl.href = '#';
                iconEl.className = 'app-icon';
                iconEl.dataset.peekAppId = id;
                const customIconUrl = peekSettings.customIcons?.[id];
                const iconUrl = customIconUrl || iconData.url;
                iconEl.innerHTML = `
                    <img src="${iconUrl}" alt="${iconData.name}" class="icon-img">
                    <span class="app-name">${iconData.name}</span>
                `;
                iconEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    generateAndRenderPeekContent(id);
                });
                appGrid.appendChild(iconEl);
            });

            // Call updateClock to immediately populate the time
            updateClock();
        }

        function renderPeekChatList(conversations = []) {
            const container = document.getElementById('peek-chat-list-container');
            container.innerHTML = '';

            if (!conversations || conversations.length === 0) {
                // This case is handled by the loading/error message in generateAndRenderPeekContent
                return;
            }

            // Use a pool of default avatars
            conversations.forEach((convo) => {
                const history = convo.history || [];
                const lastMessage = history.length > 0 ? history[history.length - 1] : null;
                const lastMessageText = lastMessage ? (lastMessage.content || '').replace(/\[.*?的消息(?:：|:)([\s\S]+)\]/, '$1') : '...';
                
                const li = document.createElement('li');
                li.className = 'list-item chat-item';
                // Use partnerName as the unique identifier for clicking
                li.dataset.name = convo.partnerName;

                const avatarUrl = 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg';

                li.innerHTML = `
                    <img src="${avatarUrl}" alt="${convo.partnerName}" class="chat-avatar">
                    <div class="item-details">
                        <div class="item-details-row"><div class="item-name">${convo.partnerName}</div></div>
                        <div class="item-preview-wrapper">
                            <div class="item-preview">${lastMessageText}</div>
                        </div>
                    </div>`;
                container.appendChild(li);
            });
        }

        function renderMemosList(memos) {
            const screen = document.getElementById('peek-memos-screen');
            let listHtml = '';
            if (!memos || memos.length === 0) {
                listHtml = '<p class="placeholder-text">正在生成备忘录...</p>';
            } else {
                memos.forEach(memo => {
                    const firstLine = memo.content.split('\n')[0];
                    listHtml += `
                        <li class="memo-item" data-id="${memo.id}">
                            <h3 class="memo-item-title">${memo.title}</h3>
                            <p class="memo-item-preview">${firstLine}</p>
                        </li>
                    `;
                });
            }

            screen.innerHTML = `
                <header class="app-header">
                    <button class="back-btn" data-target="peek-screen">‹</button>
                    <div class="title-container"><h1 class="title">备忘录</h1></div>
                    <button class="action-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg></button>
                </header>
                <main class="content"><ul id="peek-memos-list">${listHtml}</ul></main>
            `;

            screen.querySelector('.action-btn').addEventListener('click', () => {
                generateAndRenderPeekContent('memos', { forceRefresh: true });
            });

            screen.querySelectorAll('.memo-item').forEach(item => {
                item.addEventListener('click', () => {
                    // FIX: Correctly access the 'memos' array within the cached object.
                    const memo = peekContentCache.memos?.memos?.find(m => m.id === item.dataset.id);
                    if (memo) {
                        renderMemoDetail(memo);
                        switchScreen('peek-memo-detail-screen');
                    }
                });
            });
        }

        function renderMemoDetail(memo) {
            const screen = document.getElementById('peek-memo-detail-screen');
            if (!memo) return;
            const contentHtml = memo.content.replace(/\n/g, '<br>');
            screen.innerHTML = `
                <header class="app-header">
                    <button class="back-btn" data-target="peek-memos-screen">‹</button>
                    <div class="title-container"><h1 class="title">${memo.title}</h1></div>
                    <button class="action-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg></button>
                </header>
                <main class="content" style="padding: 20px; line-height: 1.6;">${contentHtml}</main>
            `;
        }

       function renderPeekCart(items) {
           const screen = document.getElementById('peek-cart-screen');
            let itemsHtml = '';
            let totalPrice = 0;

            if (!items || items.length === 0) {
                itemsHtml = '<p class="placeholder-text">正在生成购物车内容...</p>';
            } else {
                items.forEach(item => {
                    itemsHtml += `
                        <li class="cart-item" data-id="${item.id}">
                            <img src="https://i.postimg.cc/wMbSMvR9/export202509181930036600.png" class="cart-item-image" alt="${item.title}">
                            <div class="cart-item-details">
                                <h3 class="cart-item-title">${item.title}</h3>
                                <p class="cart-item-spec">规格：${item.spec}</p>
                                <p class="cart-item-price">¥${item.price}</p>
                            </div>
                        </li>
                    `;
                    totalPrice += parseFloat(item.price);
                });
            }

           screen.innerHTML = `
               <header class="app-header">
                   <button class="back-btn" data-target="peek-screen">‹</button>
                   <div class="title-container"><h1 class="title">购物车</h1></div>
                   <button class="action-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg></button>
               </header>
               <main class="content"><ul class="cart-item-list">${itemsHtml}</ul></main>
               <footer class="cart-footer">
                   <div class="cart-total-price">
                       <span class="label">合计：</span>¥${totalPrice.toFixed(2)}
                   </div>
                   <button class="checkout-btn">结算</button>
               </footer>
           `;
           
            screen.querySelector('.action-btn').addEventListener('click', () => {
                generateAndRenderPeekContent('cart', { forceRefresh: true });
            });
           screen.querySelector('.checkout-btn').addEventListener('click', () => {
               showToast('功能开发中');
           });
       }

       function renderPeekTransferStation(entries) {
           const screen = document.getElementById('peek-transfer-station-screen');
            let messagesHtml = '';

            if (!entries || entries.length === 0) {
                messagesHtml = '<p class="placeholder-text">正在生成中转站内容...</p>';
            } else {
                entries.forEach(entry => {
                    // Each entry is a message from the character to themselves.
                    // We'll render it as a 'sent' message bubble.
                    messagesHtml += `
                        <div class="message-wrapper sent">
                            <div class="message-bubble-row">
                                <div class="message-bubble sent" style="background-color: #98E165; color: #000;">
                                    ${entry}
                                </div>
                            </div>
                        </div>
                    `;
                });
            }

           screen.innerHTML = `
               <header class="app-header">
                   <button class="back-btn" data-target="peek-screen">‹</button>
                   <div class="title-container">
                       <h1 class="title">文件传输助手</h1>
                   </div>
                   <button class="action-btn">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg>
                   </button>
               </header>
               <main class="content">
                   <div class="message-area" style="padding: 10px;">
                        ${messagesHtml}
                   </div>
                   <div class="transfer-station-input-area">
                       <div class="fake-input"></div>
                       <button class="plus-btn"></button>
                   </div>
               </main>
           `;
            
            screen.querySelector('.action-btn').addEventListener('click', () => {
                generateAndRenderPeekContent('transfer', { forceRefresh: true });
            });

            const messageArea = screen.querySelector('.message-area');
            if (messageArea) {
                messageArea.scrollTop = messageArea.scrollHeight;
            }
       }

      function renderPeekBrowser(historyItems) {
          const screen = document.getElementById('peek-browser-screen');
          let itemsHtml = '';
            if (!historyItems || historyItems.length === 0) {
                itemsHtml = '<p class="placeholder-text">正在生成浏览记录...</p>';
            } else {
                historyItems.forEach(item => {
                    itemsHtml += `
                        <li class="browser-history-item">
                            <h3 class="history-item-title">${item.title}</h3>
                            <p class="history-item-url">${item.url}</p>
                            <div class="history-item-annotation">${item.annotation}</div>
                        </li>
                    `;
                });
            }

          screen.innerHTML = `
              <header class="app-header">
                  <button class="back-btn" data-target="peek-screen">‹</button>
                  <div class="title-container"><h1 class="title">浏览器</h1></div>
                  <button class="action-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg></button>
              </header>
              <main class="content"><ul class="browser-history-list">${itemsHtml}</ul></main>
          `;
          screen.querySelector('.action-btn').addEventListener('click', () => {
              generateAndRenderPeekContent('browser', { forceRefresh: true });
          });
      }

       function renderPeekDrafts(draft) {
            const screen = document.getElementById('peek-drafts-screen');
            let draftTo = '...';
            let draftContent = '<p class="placeholder-text">正在生成草稿...</p>';

            if (draft) {
                draftTo = draft.to;
                draftContent = draft.content;
            }
            
           screen.innerHTML = `
               <header class="app-header">
                   <button class="back-btn" data-target="peek-screen">‹</button>
                   <div class="title-container"><h1 class="title">草稿箱</h1></div>
                   <button class="action-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg></button>
               </header>
               <main class="content">
                   <div class="draft-paper">
                       <div class="draft-to">To: ${draftTo}</div>
                       <div class="draft-content">${draftContent}</div>
                   </div>
               </main>
           `;
            screen.querySelector('.action-btn').addEventListener('click', () => {
                generateAndRenderPeekContent('drafts', { forceRefresh: true });
            });
       }

// --- 粘贴开始 ---

/**
 * (移植自 zyj.html) 渲染AI钱包的交易列表
  */
function renderAiWalletTransactions(transactions) {
const list = document.getElementById('ai-wallet-transactions-list');
const placeholder = document.getElementById('no-wallet-placeholder');
if (!list || !placeholder) return;

list.innerHTML = ''; // 始终清空列表

if (!transactions || transactions.length === 0) {
// 如果没有数据：显示占位符，隐藏列表
placeholder.innerHTML = '<p class="placeholder-text">暂无账单记录</p>';
placeholder.style.display = 'block';
list.style.display = 'none';
return;
}

// 如果有数据：隐藏占位符，显示列表
placeholder.style.display = 'none';
list.style.display = 'block';

transactions.forEach((tx, index) => {
const li = document.createElement('li');
li.className = 'list-item ai-transaction-item';
li.dataset.index = index;
const amountSign = tx.type === 'expense' ? '-' : '+';
li.innerHTML = `
<div class="item-details">
<div>
<div class="item-name">${tx.description}</div>
<div class="item-preview">${tx.time}</div>
</div>
<span class="ai-transaction-amount ${tx.type}">${amountSign}${tx.amount.toFixed(2)}</span>
</div>
`;
list.appendChild(li);
});
}

/**
 * (移植自 zyj.html) 设置AI钱包App的内部交互
  */
function setupAiWalletApp() {
const screen = document.getElementById('ai-space-wallet-transactions-screen');
const list = document.getElementById('ai-wallet-transactions-list');
const detailModal = document.getElementById('ai-space-wallet-detail-modal');
const closeDetailBtn = document.getElementById('close-ai-wallet-detail-btn');
const refreshBtn = document.getElementById('refresh-wallet-transactions-btn');

// 刷新按钮
if (refreshBtn) {
refreshBtn.addEventListener('click', () => {
// 修复：在强制刷新时，也应该先显示"正在生成"的提示
const list = document.getElementById('ai-wallet-transactions-list');
const placeholder = document.getElementById('no-wallet-placeholder');
if (list) list.style.display = 'none';
if (placeholder) {
placeholder.innerHTML = '<p class="placeholder-text">正在生成账单...</p>';
placeholder.style.display = 'block';
}
// 启动生成
generateAndRenderPeekContent('wallet', { forceRefresh: true });
});
}

// 点击列表项
if (list) {
list.addEventListener('click', (e) => {
const item = e.target.closest('.list-item');
if (item && item.dataset.index) {
const index = parseInt(item.dataset.index, 10);
const tx = peekContentCache['wallet']?.transactions?.[index];

            if (tx) {
                document.getElementById('ai-wallet-detail-description').textContent = tx.description;
                const amountEl = document.getElementById('ai-wallet-detail-amount');
                amountEl.textContent = `${tx.type === 'expense' ? '-' : '+'}${tx.amount.toFixed(2)}`;
                amountEl.className = `ai-transaction-amount ${tx.type}`;
                document.getElementById('ai-wallet-detail-status').textContent = tx.status;
                document.getElementById('ai-wallet-detail-time').textContent = tx.time;
                document.getElementById('ai-wallet-detail-peer').textContent = tx.peer;
                detailModal.classList.add('visible');
            }
        }
    });

}

// 关闭详情弹窗
if (closeDetailBtn) {
closeDetailBtn.addEventListener('click', () => {
detailModal.classList.remove('visible');
});
}
}
// --- 粘贴结束 ---

      // ==================================================================================================================
      // ========================================== 1. API 预设管理 (API PRESET MANAGEMENT) ==========================================
      // ==================================================================================================================
       function _getApiPresets() {
           return db.apiPresets || [];
       }
       function _saveApiPresets(arr) {
           db.apiPresets = arr || [];
           saveData();
       }

       function populateApiSelect() {
           const sel = document.getElementById('api-preset-select');
           if (!sel) return;
           const presets = _getApiPresets();
           sel.innerHTML = '<option value="">— 选择 API 预设 —</option>';
           presets.forEach(p => {
           const opt = document.createElement('option');
           opt.value = p.name;
           opt.textContent = p.name;
           sel.appendChild(opt);
           });
       }

       function saveCurrentApiAsPreset() {
           const apiKeyEl = document.querySelector('#api-key');
           const apiUrlEl = document.querySelector('#api-url');
           const providerEl = document.querySelector('#api-provider');
           const modelEl = document.querySelector('#api-model');

           const data = {
               apiKey: apiKeyEl ? apiKeyEl.value : '',
               apiUrl: apiUrlEl ? apiUrlEl.value : '',
               provider: providerEl ? providerEl.value : '',
               model: modelEl ? modelEl.value : ''
           };
           
           let name = prompt('为该 API 预设填写名称（会覆盖同名预设）：');
           if (!name) return;
           const presets = _getApiPresets();
           const idx = presets.findIndex(p => p.name === name);
           const preset = {name: name, data: data};
           if (idx >= 0) presets[idx] = preset; else presets.push(preset);
           _saveApiPresets(presets);
           populateApiSelect();
           (window.showToast && showToast('API 预设已保存')) || console.log('API 预设已保存');
       }

       async function applyApiPreset(name) {
           const presets = _getApiPresets();
           const p = presets.find(x => x.name === name);
           if (!p) return (window.showToast && showToast('未找到该预设')) || alert('未找到该预设');
           try {
               const apiKeyEl = document.querySelector('#api-key');
               const apiUrlEl = document.querySelector('#api-url');
               const providerEl = document.querySelector('#api-provider');
               const modelEl = document.querySelector('#api-model');

               if (apiKeyEl && p.data && typeof p.data.apiKey !== 'undefined') apiKeyEl.value = p.data.apiKey;
               if (apiUrlEl && p.data && typeof p.data.apiUrl !== 'undefined') apiUrlEl.value = p.data.apiUrl;
               if (providerEl && p.data && typeof p.data.provider !== 'undefined') providerEl.value = p.data.provider;
               if (modelEl && p.data && typeof p.data.model !== 'undefined') {
                   modelEl.innerHTML = `<option value="${p.data.model}">${p.data.model}</option>`;
                   modelEl.value = p.data.model;
               }

               showToast('预设已应用到输入框，请点击"保存"以生效');
           } catch(e) {
               console.error('applyApiPreset error', e);
           }
       }

       function openApiManageModal() {
           const modal = document.getElementById('api-presets-modal');
           const list = document.getElementById('api-presets-list');
           if (!modal || !list) return;
           
           // 显示模态框
           modal.style.display = 'flex';
           modal.classList.add('visible');
           
           list.innerHTML = '';
           const presets = _getApiPresets();
           if (!presets.length) {
               list.innerHTML = '<p style="color:#888;margin:6px 0;">暂无预设</p>';
           }
           presets.forEach((p, idx) => {
               const row = document.createElement('div');
               row.style.display = 'flex';
               row.style.justifyContent = 'space-between';
               row.style.alignItems = 'center';
               row.style.padding = '8px 6px';
               row.style.borderBottom = '1px solid #f6f6f6';

               const left = document.createElement('div');
               left.style.flex = '1';
               left.style.minWidth = '0';
               left.innerHTML = '<div style="font-weight:600;">'+p.name+'</div><div style="font-size:12px;color:#666;margin-top:4px;">' + (p.data && p.data.provider ? ('提供者：'+p.data.provider) : '') + '</div>';

               const btns = document.createElement('div');
               btns.style.display = 'flex';
               btns.style.gap = '6px';

               const applyBtn = document.createElement('button');
               applyBtn.className = 'btn btn-primary btn-xsmall';
               applyBtn.textContent = '应用';
               applyBtn.onclick = function(){ applyApiPreset(p.name); modal.classList.remove('visible'); modal.style.display = 'none'; };

               const renameBtn = document.createElement('button');
               renameBtn.className = 'btn btn-xsmall';
               renameBtn.textContent = '重命名';
               renameBtn.onclick = function(){
                   const newName = prompt('输入新名称：', p.name);
                   if (!newName) return;
                   const all = _getApiPresets();
                   all[idx].name = newName;
                   _saveApiPresets(all);
                   openApiManageModal();
                   populateApiSelect();
               };

               const delBtn = document.createElement('button');
               delBtn.className = 'btn btn-danger btn-xsmall';
               delBtn.textContent = '删除';
               delBtn.onclick = function(){ if(!confirm('确定删除 "'+p.name+'" ?')) return; const all=_getApiPresets(); all.splice(idx,1); _saveApiPresets(all); openApiManageModal(); populateApiSelect(); };

               btns.appendChild(applyBtn); btns.appendChild(renameBtn); btns.appendChild(delBtn);

               row.appendChild(left); row.appendChild(btns);
               list.appendChild(row);
           });
           modal.classList.add('visible');
       }

   
       // ==================================================================================================================
       // =================================== 4. NAI 全局提示词预设管理 (NAI Global Prompt Presets) ===================================
       // ==================================================================================================================

       /**
        * (NAI 预设) 获取所有全局提示词预设
        * @returns {Array}
        */
       function _getNaiPromptPresets() {
           return db.naiGlobalPromptPresets || [];
       }

       /**
        * (NAI 预设) 保存全局提示词预设
        * @param {Array} arr - 预设数组
        */
       function _saveNaiPromptPresets(arr) {
           db.naiGlobalPromptPresets = arr || [];
           saveData();
       }

       /**
        * (NAI 预设) 填充预设下拉框
        */
       function populateNaiPromptPresetSelect() {
           const sel = document.getElementById('nai-global-prompt-preset-select');
           if (!sel) return;
           const presets = _getNaiPromptPresets();
           sel.innerHTML = '<option value="">— 选择全局提示词预设 —</option>';
           presets.forEach(p => {
               const opt = document.createElement('option');
               opt.value = p.name;
               opt.textContent = p.name;
               sel.appendChild(opt);
           });
       }

       /**
        * (NAI 预设) 将当前输入框内容另存为预设
        */
       function saveCurrentNaiPromptPreset() {
           const positiveEl = document.getElementById('nai-default-positive');
           const negativeEl = document.getElementById('nai-default-negative');
           if (!positiveEl || !negativeEl) return showToast('找不到提示词输入框');

           const positive = positiveEl.value.trim();
           const negative = negativeEl.value.trim();

           if (!positive && !negative) return showToast('正面和负面提示词均为空，无法保存');

           let name = prompt('请输入预设名称（将覆盖同名预设）:');
           if (!name) return;

           const presets = _getNaiPromptPresets();
           const idx = presets.findIndex(p => p.name === name);
           const preset = { name, positive, negative };

           if (idx >= 0) {
               presets[idx] = preset;
           } else {
               presets.push(preset);
           }
           _saveNaiPromptPresets(presets);
           populateNaiPromptPresetSelect();
           showToast('全局提示词预设已保存');
       }

       /**
        * (NAI 预设) 应用选定的预设到输入框
        * @param {string} presetName - 预设名称
        */
       function applyNaiPromptPreset(presetName) {
           const presets = _getNaiPromptPresets();
           const p = presets.find(x => x.name === presetName);
           if (!p) return showToast('未找到该预设');

           const positiveEl = document.getElementById('nai-default-positive');
           const negativeEl = document.getElementById('nai-default-negative');

           if (positiveEl) positiveEl.value = p.positive || '';
           if (negativeEl) negativeEl.value = p.negative || '';

           // 关键：应用后，立即保存到 localStorage，使其成为"当前"设置
           // const settings = getNovelAISettings(); // 获取其他设置 <-- 移除
           // settings.default_positive = p.positive || ''; // <-- 移除
           // settings.default_negative = p.negative || ''; // <-- 移除
           // localStorage.setItem('novelai-settings', JSON.stringify(settings)); // <-- 移除
           // 同时更新单独存储的默认值
           // localStorage.setItem('nai-global-positive', p.positive || ''); // <-- 移除
           // localStorage.setItem('nai-global-negative', p.negative || ''); // <-- 移除

           showToast(`已预览 "${presetName}"，点击最下方的"保存设置"以生效`);
       }

       /**
        * (NAI 预设) 打开预设管理弹窗
        */
       function openNaiPromptPresetManageModal() {
           const modal = document.getElementById('nai-global-prompt-presets-modal');
           const list = document.getElementById('nai-global-prompt-presets-list');
           if (!modal || !list) return;

           list.innerHTML = '';
           const presets = _getNaiPromptPresets();
           if (!presets.length) {
               list.innerHTML = '<p style="color:#888;margin:6px 0;">暂无预设</p>';
           }

           presets.forEach((p, idx) => {
               const row = document.createElement('div');
               row.style.display = 'flex';
               row.style.justifyContent = 'space-between';
               row.style.alignItems = 'center';
               row.style.padding = '8px 0';
               row.style.borderBottom = '1px solid #f0f0f0';

               const nameDiv = document.createElement('div');
               nameDiv.style.flex = '1';
               nameDiv.style.whiteSpace = 'nowrap';
               nameDiv.style.overflow = 'hidden';
               nameDiv.style.textOverflow = 'ellipsis';
               nameDiv.textContent = p.name;
               row.appendChild(nameDiv);

               const btnWrap = document.createElement('div');
               btnWrap.style.display = 'flex';
               btnWrap.style.gap = '6px';

               // ▼▼▼ BUG 修复：为按钮添加 btn-small 类，并移除行内样式 ▼▼▼
               const applyBtn = document.createElement('button');
               applyBtn.className = 'btn btn-primary btn-small'; // 修复
               applyBtn.textContent = '应用';
               applyBtn.onclick = function() {
                   applyNaiPromptPreset(p.name); // 这会填充输入框并显示新提示
                   modal.classList.remove('visible');
               };

               const renameBtn = document.createElement('button');
               renameBtn.className = 'btn btn-neutral btn-small'; // 修复
               renameBtn.textContent = '重命名';
               renameBtn.onclick = function() {
                   const newName = prompt('输入新名称：', p.name);
                   if (!newName || newName === p.name) return;
                   _getNaiPromptPresets()[idx].name = newName;
                   _saveNaiPromptPresets(db.naiGlobalPromptPresets);
                   openNaiPromptPresetManageModal(); // 刷新列表
                   populateNaiPromptPresetSelect(); // 刷新下拉框
               };

               const delBtn = document.createElement('button');
               delBtn.className = 'btn btn-danger btn-small'; // 修复
               delBtn.textContent = '删除';
               // ▲▲▲ 修复结束 ▲▲▲
               delBtn.onclick = function() {
                   if (!confirm('确定删除预设 "' + p.name + '" ?')) return;
                   _getNaiPromptPresets().splice(idx, 1);
                   _saveNaiPromptPresets(db.naiGlobalPromptPresets);
                   openNaiPromptPresetManageModal();
                   populateNaiPromptPresetSelect();
               };

               btnWrap.appendChild(applyBtn);
               btnWrap.appendChild(renameBtn);
               btnWrap.appendChild(delBtn);
               row.appendChild(btnWrap);
               list.appendChild(row);
           });

           modal.classList.add('visible');
       }

       // ==================================================================================================================
       // =================================== 2. 气泡CSS自定义预设管理 (BUBBLE CSS PRESET MANAGEMENT) ===================================
       // ==================================================================================================================
       function _getBubblePresets() {
           return db.bubbleCssPresets || [];
       }
       function _saveBubblePresets(arr) {
           db.bubbleCssPresets = arr || [];
           saveData();
       }

       function populateBubblePresetSelect(selectId) { // 增加了参数
           const sel = document.getElementById(selectId); // 使用参数
           if (!sel) return;
           const presets = _getBubblePresets();
           sel.innerHTML = '<option value="">— 选择预设 —</option>';
           presets.forEach((p) => {
               const opt = document.createElement('option');
               opt.value = p.name;
               opt.textContent = p.name;
               sel.appendChild(opt);
           });
       }

       async function applyPresetToCurrentChat(presetName) {
           const presets = _getBubblePresets();
           const preset = presets.find(p => p.name === presetName);
           if (!preset) { (window.showToast && showToast('未找到该预设')) || alert('未找到该预设'); return; }

           let textarea, checkbox, previewBox;
           let themeSelectId;

           // 修复：根据 currentChatType 精确查找控件ID
           if (currentChatType === 'private') {
               textarea = document.getElementById('setting-custom-bubble-css');
               checkbox = document.getElementById('setting-use-custom-css');
               previewBox = document.getElementById('private-bubble-css-preview');
               themeSelectId = 'setting-theme-color';
           } else if (currentChatType === 'group') {
               textarea = document.getElementById('setting-group-custom-bubble-css');
               checkbox = document.getElementById('setting-group-use-custom-css');
               previewBox = document.getElementById('group-bubble-css-preview');
               themeSelectId = 'setting-group-theme-color';
           } else {
               return; // 未知类型
           }

           if (textarea) textarea.value = preset.css;

           // 选中预设时，自动勾选 "自定义气泡样式" 并启用输入框
           if (checkbox) {
               checkbox.checked = true;
           }
           if (textarea) {
               textarea.disabled = false;
           }

           try {
               const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);

               if (chat && previewBox) {
                   let themeKey = 'white_pink'; // 默认值
                   const themeSelect = document.getElementById(themeSelectId);
                   if (themeSelect) {
                       themeKey = themeSelect.value;
                   }

                   const theme = colorThemes[themeKey] || colorThemes['white_pink'];

                   // 更新预览
                   updateBubbleCssPreview(previewBox, preset.css, false, theme);
               }

               (window.showToast && showToast(`已预览 "${presetName}"，请保存设置`)) || console.log('预设已预览');
           } catch(e){
               console.error('applyPresetToCurrentChat error', e);
           }
       }

       function saveCurrentTextareaAsPreset() {
           const textarea = document.getElementById('setting-custom-bubble-css') || document.getElementById('setting-group-custom-bubble-css');
           if (!textarea) return (window.showToast && showToast('找不到自定义 CSS 文本框')) || alert('找不到自定义 CSS 文本框');
           const css = textarea.value.trim();
           if (!css) return (window.showToast && showToast('当前 CSS 为空，无法保存')) || alert('当前 CSS 为空，无法保存');
           let name = prompt('请输入预设名称（将覆盖同名预设）:');
           if (!name) return;
           const presets = _getBubblePresets();
           const idx = presets.findIndex(p => p.name === name);
           if (idx >= 0) presets[idx].css = css;
           else presets.push({name, css});
           _saveBubblePresets(presets);
           populateBubblePresetSelect('bubble-preset-select'); populateBubblePresetSelect('group-bubble-preset-select');
           (window.showToast && showToast('预设已保存')) || alert('预设已保存');
       }

       function openManagePresetsModal() {
           const modal = document.getElementById('bubble-presets-modal');
           const list = document.getElementById('bubble-presets-list');
           if (!modal || !list) return;
           
           // 显示模态框
           modal.style.display = 'flex';
           modal.classList.add('visible');
           
           list.innerHTML = '';
           const presets = _getBubblePresets();
           if (!presets.length) list.innerHTML = '<p style="color:#888;margin:6px 0;">暂无预设</p>';
           presets.forEach((p, idx) => {
               const row = document.createElement('div');
               row.style.display = 'flex';
               row.style.justifyContent = 'space-between';
               row.style.alignItems = 'center';
               row.style.padding = '8px 0';
               row.style.borderBottom = '1px solid #f0f0f0';
               const nameDiv = document.createElement('div');
               nameDiv.style.flex = '1';
               nameDiv.style.whiteSpace = 'nowrap';
               nameDiv.style.overflow = 'hidden';
               nameDiv.style.textOverflow = 'ellipsis';
               nameDiv.textContent = p.name;
               row.appendChild(nameDiv);

               const btnWrap = document.createElement('div');
               btnWrap.style.display = 'flex';
               btnWrap.style.gap = '6px';

               const applyBtn = document.createElement('button');
               applyBtn.className = 'btn btn-primary btn-xsmall';
               applyBtn.textContent = '应用';
               applyBtn.onclick = function(){ applyPresetToCurrentChat(p.name); modal.classList.remove('visible'); modal.style.display = 'none'; };

               const renameBtn = document.createElement('button');
               renameBtn.className = 'btn btn-xsmall';
               renameBtn.textContent = '重命名';
               renameBtn.onclick = function(){
                   const newName = prompt('输入新名称：', p.name);
                   if (!newName) return;
                   const presetsAll = _getBubblePresets();
                   presetsAll[idx].name = newName;
                   _saveBubblePresets(presetsAll);
                   openManagePresetsModal(); // refresh
                   populateBubblePresetSelect('bubble-preset-select'); populateBubblePresetSelect('group-bubble-preset-select');
               };

               const delBtn = document.createElement('button');
               delBtn.className = 'btn btn-danger btn-xsmall';
               delBtn.style.padding = '6px 8px;border-radius:8px';
               delBtn.textContent = '删除';
               delBtn.onclick = function(){
                   if (!confirm('确定删除预设 \"' + p.name + '\" ?')) return;
                   const presetsAll = _getBubblePresets();
                   presetsAll.splice(idx, 1);
                   _saveBubblePresets(presetsAll);
                   openManagePresetsModal();
                   populateBubblePresetSelect('bubble-preset-select'); populateBubblePresetSelect('group-bubble-preset-select');
               };

               btnWrap.appendChild(applyBtn);
               btnWrap.appendChild(renameBtn);
               btnWrap.appendChild(delBtn);
               row.appendChild(btnWrap);
               list.appendChild(row);
           });
           modal.classList.add('visible');
       }

       // ==================================================================================================================
       // ======================================= 3. 人设预设管理 (USER PERSONA PRESET MANAGEMENT) =======================================
       // ==================================================================================================================
       function _getMyPersonaPresets() {
           return db.myPersonaPresets || [];
       }
       function _saveMyPersonaPresets(arr) {
           db.myPersonaPresets = arr || [];
           saveData();
       }

       function populateMyPersonaSelect() {
           const sel = document.getElementById('mypersona-preset-select');
           if (!sel) return;
           const presets = _getMyPersonaPresets();
           sel.innerHTML = '<option value="">— 选择预设 —</option>';
           presets.forEach(p => {
               const opt = document.createElement('option');
               opt.value = p.name;
               opt.textContent = p.name;
               sel.appendChild(opt);
           });
       }

       function saveCurrentMyPersonaAsPreset() {
           const personaEl = document.getElementById('setting-my-persona');
           const avatarEl = document.getElementById('setting-my-avatar-preview');
           if (!personaEl || !avatarEl) return (window.showToast && showToast('找不到我的人设或头像控件')) || alert('找不到我的人设或头像控件');
           const persona = personaEl.value.trim();
           const avatar = avatarEl.src || '';
           if (!persona && !avatar) return (window.showToast && showToast('人设和头像都为空，无法保存')) || alert('人设和头像都为空，无法保存');
           const name = prompt('请输入预设名称（将覆盖同名预设）：');
           if (!name) return;
           const presets = _getMyPersonaPresets();
           const idx = presets.findIndex(p => p.name === name);
           const preset = { name, persona, avatar };
           if (idx >= 0) presets[idx] = preset; else presets.push(preset);
           _saveMyPersonaPresets(presets);
           populateMyPersonaSelect();
           (window.showToast && showToast('我的人设预设已保存')) || console.log('我的人设预设已保存');
       }

       async function applyMyPersonaPresetToCurrentChat(presetName) {
           const presets = _getMyPersonaPresets();
           const p = presets.find(x => x.name === presetName);
           if (!p) { (window.showToast && showToast('未找到该预设')) || alert('未找到该预设'); return; }

           // [修改] 自动查找私聊或群聊的控件
           const personaEl = document.getElementById('setting-my-persona') || document.getElementById('setting-group-my-persona');
           const avatarEl = document.getElementById('setting-my-avatar-preview') || document.getElementById('setting-group-my-avatar-preview');

           if (personaEl) personaEl.value = p.persona || '';
           if (avatarEl) avatarEl.src = p.avatar || '';

           // [新增] 提示用户
           (window.showToast && showToast(`已预览 "${presetName}"，请保存设置`)) || console.log('预设已预览');

           // [已删除] 所有 try/catch 和 saveData() 逻辑
       }

       function openManageMyPersonaModal() {
           const modal = document.getElementById('mypersona-presets-modal');
           const list = document.getElementById('mypersona-presets-list');
           if (!modal || !list) return;
           
           // 显示模态框
           modal.style.display = 'flex';
           modal.classList.add('visible');
           
           list.innerHTML = '';
           const presets = _getMyPersonaPresets();
           if (!presets.length) list.innerHTML = '<p style="color:#888;margin:6px 0;">暂无预设</p>';
           presets.forEach((p, idx) => {
               const row = document.createElement('div');
               // ▼▼▼ 修复：为人设预设列表行添加 flex 布局样式，使其与气泡预设弹窗统一
               row.style.display = 'flex';
               row.style.justifyContent = 'space-between';
               row.style.alignItems = 'center';
               row.style.padding = '8px 0'; // 增加上下间距
               row.style.borderBottom = '1px solid #f0f0f0'; // 增加分割线
               // ▲▲▲ 修复结束

               const nameDiv = document.createElement('div');
               nameDiv.className = 'preset-name';
               nameDiv.style.flex = '1'; // ▼▼▼ 修复：让名称占据左侧所有空间
               nameDiv.style.whiteSpace = 'nowrap';
               nameDiv.style.overflow = 'hidden';
               nameDiv.style.textOverflow = 'ellipsis';
               nameDiv.textContent = p.name;

               const btnWrap = document.createElement('div');
               btnWrap.className = 'preset-actions';
               // ▼▼▼ 修复：让按钮组横向排列
               btnWrap.style.display = 'flex';
               btnWrap.style.gap = '6px'; // 按钮之间的间距
               // ▲▲▲ 修复结束

               const applyBtn = document.createElement('button');
               applyBtn.className = 'btn btn-primary btn-xsmall';
               applyBtn.textContent = '应用';
               applyBtn.onclick = function(){ applyMyPersonaPresetToCurrentChat(p.name); modal.classList.remove('visible'); modal.style.display = 'none'; };

               const renameBtn = document.createElement('button');
               renameBtn.className = 'btn btn-xsmall';
               renameBtn.textContent = '重命名';
               renameBtn.onclick = function(){
                   const newName = prompt('输入新名称：', p.name);
                   if (!newName) return;
                   const all = _getMyPersonaPresets();
                   all[idx].name = newName;
                   _saveMyPersonaPresets(all);
                   openManageMyPersonaModal();
                   populateMyPersonaSelect();
               };

               const deleteBtn = document.createElement('button');
               deleteBtn.className = 'btn btn-danger btn-xsmall';
               deleteBtn.textContent = '删除';
               deleteBtn.onclick = function(){
                   if (!confirm('确认删除该预设？')) return;
                   const all = _getMyPersonaPresets();
                   all.splice(idx,1);
                   _saveMyPersonaPresets(all);
                   openManageMyPersonaModal();
                   populateMyPersonaSelect();
               };

               btnWrap.appendChild(applyBtn);
               btnWrap.appendChild(renameBtn);
               btnWrap.appendChild(deleteBtn);

               row.appendChild(nameDiv);
               row.appendChild(btnWrap);

               list.appendChild(row);
           });

           modal.classList.add('visible');
       }

        function updateClock() {
            const now = new Date();
            const timeString = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
            const dateString = `${now.getFullYear()}年${pad(now.getMonth() + 1)}月${pad(now.getDate())}日`;

            const homeTimeDisplay = document.getElementById('time-display');
            const homeDateDisplay = document.getElementById('date-display');
            if (homeTimeDisplay) homeTimeDisplay.textContent = timeString;
            if (homeDateDisplay) homeDateDisplay.textContent = dateString;

            const peekTimeDisplay = document.getElementById('peek-time-display');
            const peekDateDisplay = document.getElementById('peek-date-display');
            if (peekTimeDisplay) peekTimeDisplay.textContent = timeString;
            if (peekDateDisplay) peekDateDisplay.textContent = dateString;
        }

        function updatePageIndicator(index) {
            const dots = document.querySelectorAll('.page-indicator .dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        // --- App Setup Functions ---
        
        // ==================================================================================================================
        // ========================================== 角色卡导入 (CHARACTER IMPORT) ==========================================
        // ==================================================================================================================
        
        /**
         * 处理角色卡文件导入
         * @param {File} file - 用户选择的文件
         */
        async function handleCharacterImport(file) {
            if (!file) return;

            showToast('正在导入角色卡...');

            try {
                if (file.name.endsWith('.png')) {
                    await parseCharPng(file);
                } else if (file.name.endsWith('.json')) {
                    await parseCharJson(file);
                } else {
                    throw new Error('不支持的文件格式。请选择 .png 或 .json 文件。');
                }
            } catch (error) {
                console.error('角色卡导入失败:', error);
                showToast(`导入失败: ${error.message}`);
            }
        }

        /**
         * 解析PNG角色卡
         * @param {File} file - PNG文件
         */
        function parseCharPng(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = (e) => {
                    try {
                        const buffer = e.target.result;
                        const view = new DataView(buffer);

                        // 1. 验证PNG文件签名 (PNG signature)
                        const signature = [137, 80, 78, 71, 13, 10, 26, 10];
                        for (let i = 0; i < signature.length; i++) {
                            if (view.getUint8(i) !== signature[i]) {
                                return reject(new Error('文件不是一个有效的PNG。'));
                            }
                        }

                        let offset = 8; // 跳过8字节的签名
                        let charaData = null;

                        // 2. 遍历PNG数据块 (chunks)
                        while (offset < view.byteLength) {
                            const length = view.getUint32(offset); // 数据块内容的长度
                            const type = String.fromCharCode(view.getUint8(offset + 4), view.getUint8(offset + 5), view.getUint8(offset + 6), view.getUint8(offset + 7));
                            
                            // 3. 寻找tEXt文本块
                            if (type === 'tEXt') {
                                const textChunk = new Uint8Array(buffer, offset + 8, length);
                                
                                // 寻找关键字和数据之间的空字符分隔符
                                let separatorIndex = -1;
                                for(let i = 0; i < textChunk.length; i++) {
                                    if (textChunk[i] === 0) {
                                        separatorIndex = i;
                                        break;
                                    }
                                }

                                if (separatorIndex !== -1) {
                                    const keyword = new TextDecoder('utf-8').decode(textChunk.slice(0, separatorIndex));
                                    
                                    // 4. 检查关键字是否为 'chara'
                                    if (keyword === 'chara') {
                                        const base64Data = new TextDecoder('utf-8').decode(textChunk.slice(separatorIndex + 1));
                                        
                                        // 5. 解码Base64数据
                                        try {
                                            const decodedString = atob(base64Data);
                                            const bytes = new Uint8Array(decodedString.length);
                                            for (let i = 0; i < decodedString.length; i++) {
                                                bytes[i] = decodedString.charCodeAt(i);
                                            }
                                            const utf8Decoder = new TextDecoder('utf-8');
                                            charaData = JSON.parse(utf8Decoder.decode(bytes));
                                            break; // 找到数据后就停止遍历
                                        } catch (decodeError) {
                                            return reject(new Error(`解析角色数据失败: ${decodeError.message}`));
                                        }
                                    }
                                }
                            }
                            
                            // 移动到下一个数据块 (长度 + 类型 + 内容 + CRC校验 = 4 + 4 + length + 4)
                            offset += 12 + length;
                        }

                        if (charaData) {
                            // 6. 将PNG文件本身转换为头像的Data URL
                            const imageReader = new FileReader();
                            imageReader.readAsDataURL(file);
                            imageReader.onload = (imgEvent) => {
                                createCharacterFromData(charaData, imgEvent.target.result);
                                resolve();
                            };
                            imageReader.onerror = () => {
                                // 即使头像转换失败，也用默认头像创建角色
                                createCharacterFromData(charaData, 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg');
                                resolve();
                            };
                        } else {
                            reject(new Error('在PNG中未找到有效的角色数据 (tEXt chunk not found or invalid)。'));
                        }
                    } catch (error) {
                        reject(new Error(`解析PNG失败: ${error.message}`));
                    }
                };
                reader.onerror = () => reject(new Error('读取PNG文件失败。'));
            });
        }

        /**
         * 解析JSON角色卡
         * @param {File} file - JSON文件
         */
        function parseCharJson(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                // 强制使用UTF-8解码
                reader.readAsText(file, 'UTF-8');
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        // JSON卡没有内置头像，使用默认头像
                        createCharacterFromData(data, 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg');
                        resolve();
                    } catch (error) {
                        reject(new Error(`解析JSON失败: ${error.message}`));
                    }
                };
                reader.onerror = () => reject(new Error('读取JSON文件失败。'));
            });
        }

        /**
         * 根据导入的数据创建新角色
         * @param {object} data - 从卡片解析出的角色数据
         * @param {string} avatar - Base64格式的头像数据
         */
        async function createCharacterFromData(data, avatar) {
            // 优先使用 data.data 结构（针对哈基米.json格式），同时保留对根级别数据的兼容
            const charData = data.data || data;

            if (!charData || !charData.name) {
                throw new Error('角色卡数据无效，缺少角色名称。');
            }

            // 数据映射：将导入卡片的字段映射到本应用的字段
            const newChar = {
                id: `char_${Date.now()}`,
                realName: charData.name || '未命名',
                remarkName: charData.name || '未命名',
                persona: charData.description || charData.persona || '',
                avatar: avatar || 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg',
                myName: '',
                myPersona: '',
                myAvatar: 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg',
                theme: 'white_pink',
                maxMemory: 10,
                chatBg: '',
                history: [],
                isPinned: false,
                status: '在线',
                worldBookIds: [],
                useCustomBubbleCss: false,
                customBubbleCss: '',
                unreadCount: 0,
                memoryJournals: [],
                journalWorldBookIds: [],
                peekScreenSettings: { wallpaper: '', customIcons: {}, unlockAvatar: '' },
                lastUserMessageTimestamp: null,
            };

            const importedWorldBookIds = [];
            let structuredEntries = [];

            if (charData.character_book && Array.isArray(charData.character_book.entries)) {
                structuredEntries = charData.character_book.entries.map(entry => {
                    const keys = (entry.keys || []).map(k => k.trim().toLowerCase()).filter(k => k);
                    return {
                        enabled: (entry.enabled !== undefined) ? entry.enabled : true,
                        keys: keys,
                        comment: entry.comment || '',
                        content: entry.content || ''
                    };
                }).filter(entry => entry.content);
            } else {
                const worldInfo = charData.world_info || charData.wi || '';
                if (worldInfo && typeof worldInfo === 'string' && worldInfo.trim() !== '') {
                    const entriesText = worldInfo.split(/\n\s*\n/).filter(entry => entry.trim() !== '');
                    
                    structuredEntries = entriesText.map(entryText => {
                        const lines = entryText.trim().split('\n');
                        let content = entryText.trim();
                        let comment = '';

                        if (lines.length > 1) {
                            comment = lines[0].trim();
                            content = lines.slice(1).join('\n').trim();
                        }

                        return {
                            enabled: true,
                            keys: [],
                            comment: comment || 'PNG导入条目',
                            content: content
                        };
                    }).filter(entry => entry.content);
                }
            }
            
            if (structuredEntries.length > 0) {
                const newBook = {
                    id: `wb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    name: `${charData.name}的设定集`,
                    content: structuredEntries,
                    position: 'after',
                    category: '设定集'
                };
                db.worldBooks.push(newBook);
                importedWorldBookIds.push(newBook.id);

                setTimeout(() => {
                    showToast(`同时导入了 ${structuredEntries.length} 条世界书设定。`);
                }, 1600);
            }
            
            if (importedWorldBookIds.length > 0) {
                newChar.worldBookIds = importedWorldBookIds;
            }

            db.characters.push(newChar);
            await saveData();
            renderChatList();
            showToast(`角色“${newChar.remarkName}”导入成功！`);
        }

        // ==================================================================================================================
        // ========================================== END CHARACTER IMPORT ==================================================
        // ==================================================================================================================

        let currentPageIndex = 0;
        function setupHomeScreen() {
            const getIcon = (id) => db.customIcons[id] || defaultIcons[id].url;
            // Ensure insWidgetSettings exists with defaults
            if (!db.insWidgetSettings) {
                db.insWidgetSettings = {
                    avatar1: 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg',
                    bubble1: '„- ω -„',
                    avatar2: 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg',
                    bubble2: 'ｷ...✩'
                };
            }
            const insWidget = db.insWidgetSettings;

            const homeScreenHTML = `
            <div class="home-screen-swiper">
                <div class="home-screen-page">
                    <div class="home-widget-container">
                        <div class="central-circle" style="background-image: url('${db.homeWidgetSettings.centralCircleImage}');"></div>
                        <div class="satellite-oval oval-top-left" data-widget-part="topLeft">
                            <span class="satellite-emoji" contenteditable="true">${db.homeWidgetSettings.topLeft.emoji || '❤️'}</span>
                            <span class="satellite-text" contenteditable="true">${db.homeWidgetSettings.topLeft.text}</span>
                        </div>
                        <div class="satellite-oval oval-top-right" data-widget-part="topRight">
                            <span class="satellite-emoji" contenteditable="true">${db.homeWidgetSettings.topRight.emoji || '🧡'}</span>
                            <span class="satellite-text" contenteditable="true">${db.homeWidgetSettings.topRight.text}</span>
                        </div>
                        <div class="satellite-oval oval-bottom-left" data-widget-part="bottomLeft">
                            <span class="satellite-emoji" contenteditable="true">${db.homeWidgetSettings.bottomLeft.emoji || '💛'}</span>
                            <span class="satellite-text" contenteditable="true">${db.homeWidgetSettings.bottomLeft.text}</span>
                        </div>
                        <div class="satellite-oval oval-bottom-right" data-widget-part="bottomRight">
                            <span class="satellite-emoji" contenteditable="true">${db.homeWidgetSettings.bottomRight.emoji || '💙'}</span>
                            <span class="satellite-text" contenteditable="true">${db.homeWidgetSettings.bottomRight.text}</span>
                        </div>


                        <div class="widget-time" id="time-display"></div>
                        <div contenteditable="true" class="widget-signature" id="widget-signature" placeholder="编辑个性签名..."></div>
                        <div class="widget-date" id="date-display"></div>
                        <div class="widget-battery">
                            <svg width="32" height="23" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 2.5C1 1.94772 1.44772 1.5 2 1.5H20C20.5523 1.5 21 1.94772 21 2.5V9.5C21 10.0523 20.5523 10.5 20 10.5H2C1.44772 10.5 1 10.0523 1 9.5V2.5Z" stroke="#666" stroke-opacity="0.8" stroke-width="1"/>
                                <path d="M22.5 4V8" stroke="#666" stroke-opacity="0.8" stroke-width="1.5" stroke-linecap="round"/>
                                <rect id="battery-fill-rect" x="2" y="2.5" width="18" height="7" rx="0.5" fill="#666" fill-opacity="0.8"/>
                            </svg>
                            <span id="battery-level">--%</span>
                        </div>
                    </div>
                    <div class="app-grid">
                        <div class="app-grid-widget-container">
                           <div class="app-grid-widget">
                                <div class="ins-widget">
                                    <div class="ins-widget-row user">
                                        <img src="${insWidget.avatar1}" alt="Character Avatar" class="ins-widget-avatar" id="ins-widget-avatar-1">
                                        <div class="ins-widget-bubble" id="ins-widget-bubble-1" contenteditable="true">${insWidget.bubble1}</div>
                                    </div>
                                    <div class="ins-widget-divider"><span>୨୧</span></div>
                                    <div class="ins-widget-row character">
                                        <div class="ins-widget-bubble" id="ins-widget-bubble-2" contenteditable="true">${insWidget.bubble2}</div>
                                        <img src="${insWidget.avatar2}" alt="User Avatar" class="ins-widget-avatar" id="ins-widget-avatar-2">
                                    </div>
                                </div>
                           </div>
                        </div>
                        <a href="#" class="app-icon" data-target="chat-list-screen"><img src="${getIcon('chat-list-screen')}" alt="404" class="icon-img"><span class="app-name">${defaultIcons['chat-list-screen'].name}</span></a>
                        <a href="#" class="app-icon" data-target="api-settings-screen"><img src="${getIcon('api-settings-screen')}" alt="API" class="icon-img"><span class="app-name">${defaultIcons['api-settings-screen'].name}</span></a>
                        <a href="#" class="app-icon" data-target="peek-character-select-screen"><img src="${getIcon('peek-select-btn')}" alt="查手机" class="icon-img"><span class="app-name">${defaultIcons['peek-select-btn'].name}</span></a>
                        <a href="#" class="app-icon" data-target="world-book-screen"><img src="${getIcon('world-book-screen')}" alt="World Book" class="icon-img"><span class="app-name">${defaultIcons['world-book-screen'].name}</span></a>
                        <a href="#" class="app-icon" data-target="customize-screen"><img src="${getIcon('customize-screen')}" alt="Customize" class="icon-img"><span class="app-name">${defaultIcons['customize-screen'].name}</span></a>
                        <a href="#" class="app-icon" data-target="tutorial-screen"><img src="${getIcon('tutorial-screen')}" alt="Tutorial" class="icon-img"><span class="app-name">${defaultIcons['tutorial-screen'].name}</span></a>
                        <div class="heart-photo-widget"></div>
                    </div>
                </div>

                <div class="home-screen-page">
                     <div class="app-grid">
                        <a href="#" class="app-icon" data-target="storage-analysis-screen"><img src="${getIcon('storage-analysis-screen')}" alt="存储分析" class="icon-img"><span class="app-name">${defaultIcons['storage-analysis-screen'].name}</span></a>
                        <a href="#" class="app-icon" data-target="pomodoro-screen">
                            <img src="${getIcon('pomodoro-screen')}" alt="番茄钟" class="icon-img">
                            <span class="app-name">${defaultIcons['pomodoro-screen'].name}</span>
                        </a>
                        <a href="#" class="app-icon" data-target="forum-screen">
                            <img src="${getIcon('forum-screen')}" alt="论坛" class="icon-img">
                            <span class="app-name">${defaultIcons['forum-screen'].name}</span>
                        </a>
                        <a href="#" class="app-icon" data-target="music-screen">
    <img src="${getIcon('music-screen')}" alt="音乐" class="icon-img">
    <span class="app-name">${defaultIcons['music-screen'].name}</span>
</a>
                        <a href="#" class="app-icon" data-target="diary-screen">
                            <img src="${getIcon('diary-screen')}" alt="日记本" class="icon-img">
                            <span class="app-name">${defaultIcons['diary-screen'].name}</span>
                        </a>
                        <a href="#" class="app-icon" data-target="piggy-bank-screen">
                            <img src="${getIcon('piggy-bank-screen')}" alt="存钱罐" class="icon-img">
                            <span class="app-name">${defaultIcons['piggy-bank-screen'].name}</span>
                        </a>
                     </div>
                </div>

            </div>
            <div class="page-indicator">
                <span class="dot active" data-page="0"></span>
                <span class="dot" data-page="1"></span>
            </div>
            <div class="dock">
                <a href="#" class="app-icon" id="day-mode-btn"><img src="${getIcon('day-mode-btn')}" alt="日间" class="icon-img"></a>
                <a href="#" class="app-icon" id="night-mode-btn"><img src="${getIcon('night-mode-btn')}" alt="夜间" class="icon-img"></a>
                <a href="#" class="app-icon" data-target="font-settings-screen"><img src="${getIcon('font-settings-screen')}" alt="字体" class="icon-img"></a>
            </div>`;
            homeScreen.innerHTML = homeScreenHTML;

           const polaroidImage = db.homeWidgetSettings?.polaroidImage;
           if (polaroidImage) {
               updatePolaroidImage(polaroidImage);
           }

            updateClock();
            applyWallpaper(db.wallpaper);
            applyHomeScreenMode(db.homeScreenMode);
            document.getElementById('day-mode-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                applyHomeScreenMode('day');
            });
            document.getElementById('night-mode-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                applyHomeScreenMode('night');
            });
            document.querySelector('[data-target="world-book-screen"]').addEventListener('click', (e) => {
                e.preventDefault(); // 阻止默认行为
                renderWorldBookList();
                switchScreen('world-book-screen'); // 切换屏幕
            });
            // NEW: Add listener for peek-character-select-screen
            document.querySelector('[data-target="peek-character-select-screen"]').addEventListener('click', (e) => {
                e.preventDefault();
                renderPeekCharacterSelectScreen(); // 渲染选择列表
                switchScreen('peek-character-select-screen'); // 切换屏幕
            });
            document.querySelector('[data-target="customize-screen"]').addEventListener('click', (e) => {
                e.preventDefault(); // 阻止默认行为
                renderCustomizeForm();
                switchScreen('customize-screen'); // 切换屏幕
            });
            document.querySelector('[data-target="tutorial-screen"]').addEventListener('click', (e) => {
                e.preventDefault(); // 阻止默认行为
                renderTutorialContent();
                switchScreen('tutorial-screen'); // 切换屏幕
            });
            updateBatteryStatus();

            const homeWidgetContainer = homeScreen.querySelector('.home-widget-container');

            // --- Central Circle Click ---
            const centralCircle = homeWidgetContainer.querySelector('.central-circle');
            if (centralCircle) {
                centralCircle.addEventListener('click', () => {
                    const modal = document.getElementById('ins-widget-avatar-modal');
                    const form = document.getElementById('ins-widget-avatar-form');
                    const preview = document.getElementById('ins-widget-avatar-preview');
                    const urlInput = document.getElementById('ins-widget-avatar-url-input');
                    const fileUpload = document.getElementById('ins-widget-avatar-file-upload');
                    const targetInput = document.getElementById('ins-widget-avatar-target');

                    targetInput.value = 'centralCircle'; // Special target
                    preview.style.backgroundImage = `url("${db.homeWidgetSettings.centralCircleImage}")`;
                    preview.innerHTML = '';
                    urlInput.value = '';
                    fileUpload.value = null;
                    modal.classList.add('visible');
                });
            }

            // --- Blur to Save Logic ---
            homeScreen.addEventListener('blur', async (e) => {
                const target = e.target;
                if (target.hasAttribute('contenteditable')) {
                    const oval = target.closest('.satellite-oval');
                    if (oval) { // It's one of the satellite ovals
                        const part = oval.dataset.widgetPart;
                        const prop = target.classList.contains('satellite-emoji') ? 'emoji' : 'text';
                        const newValue = target.textContent.trim();

                        if (db.homeWidgetSettings[part] && db.homeWidgetSettings[part][prop] !== newValue) {
                            db.homeWidgetSettings[part][prop] = newValue;
                            await saveData();
                            showToast('小组件已更新');
                        }
                    } else if (target.id === 'widget-signature') { // It's the signature
                        const newSignature = target.textContent.trim();
                        if (db.homeSignature !== newSignature) {
                            db.homeSignature = newSignature;
                            await saveData();
                            showToast('签名已保存');
                        }
                    } else if (target.id === 'ins-widget-bubble-1' || target.id === 'ins-widget-bubble-2') { // It's the INS widget
                         const bubbleId = target.id === 'ins-widget-bubble-1' ? 'bubble1' : 'bubble2';
                         const newText = target.textContent.trim();
                         if (db.insWidgetSettings[bubbleId] !== newText) {
                             db.insWidgetSettings[bubbleId] = newText;
                             await saveData();
                             showToast('小组件文字已保存');
                         }
                    }
                }
            }, true); // Use capture phase
            
            const signatureWidget = document.getElementById('widget-signature');
            if (signatureWidget) {
                signatureWidget.textContent = db.homeSignature || '';
            }


            // --- Home Screen Swipe Logic ---
            const swiper = homeScreen.querySelector('.home-screen-swiper');
            let touchStartX = 0;
            let touchEndX = 0;
            // currentPageIndex is now global
            const totalPages = 2;
            const swipeThreshold = 50; // Minimum distance for a swipe
            let isDragging = false;

            // Apply initial state based on global currentPageIndex
            swiper.style.transform = `translateX(-${currentPageIndex * 100 / totalPages}%)`;
            updatePageIndicator(currentPageIndex);

            // --- Touch Events ---
            swiper.addEventListener('touchstart', (e) => {
                if (e.target.closest('[contenteditable]')) return; // <-- 新增这行
                // No longer need to check for target, the whole area is swipeable
                isDragging = true;
                touchStartX = e.changedTouches[0].screenX;
                touchEndX = e.changedTouches[0].screenX; // Reset on start
            }, { passive: true });

            swiper.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                touchEndX = e.changedTouches[0].screenX;
            }, { passive: true });

            swiper.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                isDragging = false;
                handleSwipe();
            });

            // --- Mouse Events ---
            swiper.addEventListener('mousedown', (e) => {
                if (e.target.closest('[contenteditable]')) return; // <-- 新增这行
                // Prevent default browser action (like dragging a link)
                e.preventDefault();
                isDragging = true;
                touchStartX = e.screenX;
                touchEndX = e.screenX; // Reset on start
                swiper.style.cursor = 'grabbing';
            });

            swiper.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    touchEndX = e.screenX;
                }
            });

            swiper.addEventListener('mouseup', (e) => {
                if (isDragging) {
                    isDragging = false;
                    swiper.style.cursor = 'grab';
                    handleSwipe();
                }
            });

            swiper.addEventListener('mouseleave', (e) => {
                if (isDragging) {
                    isDragging = false;
                    swiper.style.cursor = 'grab';
                    // Reset positions to cancel swipe
                    touchStartX = 0;
                    touchEndX = 0;
                }
            });

            function handleSwipe() {
                if (touchEndX === 0 && touchStartX === 0) return; // Swipe was cancelled by mouseleave
                
                const deltaX = touchEndX - touchStartX;

                if (Math.abs(deltaX) > swipeThreshold) {
                    if (deltaX < 0 && currentPageIndex < totalPages - 1) {
                        currentPageIndex++;
                    } else if (deltaX > 0 && currentPageIndex > 0) {
                        currentPageIndex--;
                    }
                }
                
                swiper.style.transform = `translateX(-${currentPageIndex * 100 / totalPages}%)`;
                updatePageIndicator(currentPageIndex);

                // Reset positions
                touchStartX = 0;
                touchEndX = 0;
            }

            // 新增：处理失焦的逻辑
            homeScreen.addEventListener('click', (e) => {
                const activeEl = document.activeElement;
                if (activeEl && activeEl.hasAttribute('contenteditable') && e.target !== activeEl) {
                    activeEl.blur();
                }
            });

            // 新增：限制emoji小组件只能输入一个字符
            homeScreen.querySelectorAll('.satellite-emoji').forEach(span => {
                span.addEventListener('input', (e) => {
                    const chars = [...e.target.textContent];
                    if (chars.length > 1) {
                        e.target.textContent = chars[0];
                        // 重新聚焦并把光标移动到末尾
                        const range = document.createRange();
                        const sel = window.getSelection();
                        range.selectNodeContents(e.target);
                        range.collapse(false);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                });
            });
        }

        function applyWallpaper(url) {
            homeScreen.style.backgroundImage = `url(${url})`;
        }

        async function applyHomeScreenMode(mode) {
            if (mode === 'day') {
                homeScreen.classList.add('day-mode');
            } else {
                homeScreen.classList.remove('day-mode');
            }
            db.homeScreenMode = mode;
            await saveData();
        }

                function setupCustomizeApp() {
            customizeForm.addEventListener('input', async (e) => {
                const target = e.target;

                // --- 处理应用图标的逻辑 ---
                if (target.dataset.iconId) { // 修改这里，统一使用一个标识
                    const iconId = target.dataset.iconId;
                    const newUrl = target.value.trim();
                    const previewImg = document.getElementById(`icon-preview-${iconId}`);
                    if (newUrl) {
                        if (!db.customIcons) db.customIcons = {}; // 确保 customIcons 已初始化
                        db.customIcons[iconId] = newUrl;
                        if(previewImg) previewImg.src = newUrl;
                    }
                // --- 新增：处理小部件的逻辑 ---
                } else if (target.dataset.widgetPart) {
                    const part = target.dataset.widgetPart;
                    const prop = target.dataset.widgetProp;
                    const newValue = target.value.trim();

                    if (prop) { // 这是小椭圆 (有prop属性)
                        db.homeWidgetSettings[part][prop] = newValue;
                    } else { // 这是中央大圆 (没有prop属性)
                        db.homeWidgetSettings[part] = newValue;
                    }
                }

                await saveData();
                setupHomeScreen(); // 实时刷新主页
            });
            customizeForm.addEventListener('click', async (e) => {
                // --- 处理重置应用图标的逻辑 ---
                if (e.target.matches('.reset-icon-btn')) {
                    const iconId = e.target.dataset.id;
                    if (db.customIcons) {
                        delete db.customIcons[iconId];
                    }
                    await saveData();
                    renderCustomizeForm(); // 重新渲染自定义页
                    setupHomeScreen(); // 刷新主页
                    showToast('图标已重置');
                }

                // --- 新增：处理重置小部件的逻辑 ---
                if (e.target.matches('#reset-widget-btn')) {
                    if (confirm('确定要将小部件恢复为默认设置吗？')) {
                        db.homeWidgetSettings = JSON.parse(JSON.stringify(defaultWidgetSettings));
                        await saveData();
                        renderCustomizeForm(); // 重新渲染自定义页
                        setupHomeScreen(); // 刷新主页
                        showToast('小部件已恢复默认');
                    }
                }

                // --- 新增：处理重置小部件的逻辑 ---
                if (e.target.matches('#reset-widget-btn')) {
                    if (confirm('确定要将小部件恢复为默认设置吗？')) {
                        db.homeWidgetSettings = JSON.parse(JSON.stringify(defaultWidgetSettings));
                        await saveData();
                        renderCustomizeForm(); // 重新渲染自定义页
                        setupHomeScreen(); // 刷新主页
                        showToast('小部件已恢复默认');
                    }
                }

              });

         customizeForm.addEventListener('change', async (e) => {
             // --- 处理壁纸上传 ---
             if (e.target.matches('#wallpaper-upload-customize')) {
                 const file = e.target.files[0];
                 if (file) {
                     try {
                         const compressedUrl = await compressImage(file, {quality: 0.85, maxWidth: 1080, maxHeight: 1920});
                         db.wallpaper = compressedUrl;
                         applyWallpaper(compressedUrl);
                         document.getElementById('wallpaper-preview-customize').style.backgroundImage = `url(${compressedUrl})`;
                         await saveData();
                         showToast('壁纸更换成功！');
                     } catch (error) {
                         showToast('壁纸压缩失败，请重试');
                     } finally {
                         e.target.value = null; // Reset file input
                     }
                 }
             }

             if (e.target.matches('.widget-upload-input')) {
                 const file = e.target.files[0];
                 if (!file) return;
 
                 const widgetPart = e.target.dataset.widgetTarget;
                 const widgetProp = e.target.dataset.widgetProp;
 
                 try {
                     const compressedUrl = await compressImage(file, { quality: 0.8, maxWidth: 400, maxHeight: 400 });
                     
                     let targetInput;
                     if (widgetProp) {
                         targetInput = document.getElementById(`widget-input-${widgetPart}-${widgetProp}`);
                     } else {
                         targetInput = document.getElementById(`widget-input-${widgetPart}`);
                     }
 
                     if (targetInput) {
                         targetInput.value = compressedUrl;
                         // Manually trigger an input event to save the data
                         targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                         showToast('图片已上传并压缩');
                     }
                 } catch (error) {
                     console.error('Widget image compression failed:', error);
                     showToast('图片压缩失败，请重试');
                 } finally {
                     e.target.value = null; // Reset file input
                 }
             }
         });
         
         const cssImportInput = document.getElementById('import-global-css-input');
         if (cssImportInput) {
             cssImportInput.addEventListener('change', (e) => {
                 const file = e.target.files[0];
                 if (file) {
                     handleGlobalCssImport(file);
                 }
                 e.target.value = null;
             });
         }
        }

                function renderCustomizeForm() {
            customizeForm.innerHTML = ''; // 清空旧内容

            // --- 0. 壁纸设置部分 (新增到顶部) ---
            const wallpaperSectionHTML = `
            <div class="collapsible-section open">
                <div class="collapsible-header">
                    <h4>页面壁纸</h4>
                    <span class="collapsible-arrow">▼</span>
                </div>
                <div class="collapsible-content">
                    <div class="wallpaper-preview" id="wallpaper-preview-customize"><span>当前壁纸预览</span></div>
                    <input type="file" id="wallpaper-upload-customize" accept="image/*" style="display: none;">
                    <label for="wallpaper-upload-customize" class="btn btn-primary">从相册选择新壁纸</label>
                </div>
            </div>
            `;
            customizeForm.insertAdjacentHTML('beforeend', wallpaperSectionHTML);

            // --- 1. 应用图标自定义部分 ---
            const iconOrder = [
                'chat-list-screen', 'api-settings-screen',
                'world-book-screen', 'peek-select-btn', 'customize-screen', 'tutorial-screen',
                'font-settings-screen', 'day-mode-btn', 'night-mode-btn', 'forum-screen', 'music-screen', 'diary-screen', 'piggy-bank-screen', 'pomodoro-screen', 'storage-analysis-screen'
            ];

            let iconsContentHTML = '';
            iconOrder.forEach(id => {
                const { name, url } = defaultIcons[id];
                const currentIcon = (db.customIcons && db.customIcons[id]) || url;
                iconsContentHTML += `
                <div class="icon-custom-item">
                    <img src="${currentIcon}" alt="${name}" class="icon-preview" id="icon-preview-${id}">
                    <div class="icon-details">
                        <p>${name || '模式切换'}</p>
                        <input type="url" class="form-group" placeholder="粘贴新的图标URL" value="${(db.customIcons && db.customIcons[id]) || ''}" data-icon-id="${id}">
                    </div>
                    <button type="button" class="reset-icon-btn" data-id="${id}">重置</button>
                </div>`;
            });

            const iconsSectionHTML = `
            <div class="collapsible-section">
                <div class="collapsible-header">
                    <h4>应用图标</h4>
                    <span class="collapsible-arrow">▼</span>
                </div>
                <div class="collapsible-content">
                    ${iconsContentHTML}
                </div>
            </div>
            `;
            customizeForm.insertAdjacentHTML('beforeend', iconsSectionHTML);

            // --- 2. 主页小部件自定义部分 ---
            const widgetSectionHTML = `
            <div class="collapsible-section">
                <div class="collapsible-header">
                    <h4>主页小部件</h4>
                    <span class="collapsible-arrow">▼</span>
                </div>
                <div class="collapsible-content">
                    <p style="font-size: 13px; color: #555; margin-bottom: 20px; text-align: left; line-height: 1.6;">
                        > <strong>主屏幕上的小组件内容</strong>可以直接点击编辑，失焦后自动保存。<br>
                        > <strong>中央头像</strong>则是在主屏幕点击后弹窗更换。
                    </p>
                    <button type="button" id="reset-widget-btn" class="btn btn-neutral" style="margin-top: 10px; width: 100%;">恢复默认</button>
                </div>
            </div>
            `;
            customizeForm.insertAdjacentHTML('beforeend', widgetSectionHTML);

            // --- 3. 全局CSS美化部分 ---
            const globalCssSectionHTML = `
            <div class="collapsible-section">
                <div class="collapsible-header">
                    <h4>全局CSS美化</h4>
                    <span class="collapsible-arrow">▼</span>
                </div>
                <div class="collapsible-content">
                    
                    <div class="form-group" style="margin-bottom: 20px; margin-top: 15px;">
                        <label for="global-css-preset-select" style="font-size: 14px; margin-left: 0; color: var(--primary-color); font-weight: bold; margin-bottom: 10px;">全局样式预设库</label>
                        <div style="display:flex;align-items:flex-end;gap:10px;">
                            <select id="global-css-preset-select" style="flex:1;min-width:120px;padding:12px;border-radius:10px;border:2px solid #fce4ec;background-color:#fff;">
                                <option value="">— 选择预设 —</option>
                            </select>
                            <button type="button" id="global-css-save-btn" class="btn btn-secondary" style="flex-shrink:0;white-space:nowrap;min-width:auto;width:auto;margin:0;">另存</button>
                            <button type="button" id="global-css-manage-btn" class="btn btn-neutral" style="flex-shrink:0;white-space:nowrap;min-width:auto;width:auto;margin:0;">管理</button>
                        </div>
                    </div>

                    <div class="form-group" style="margin-top: 0px;">
                        <label for="global-beautification-css" style="font-weight: bold; font-size: 14px; color: var(--primary-color); margin-bottom: 10px;">全局美化CSS代码</label>
                        <textarea id="global-beautification-css" class="form-group" rows="8" placeholder="在此输入CSS代码... 您的创造力没有边界！" style="margin-bottom: 20px;"></textarea>
                    </div>

                    <div style="display:flex;gap:15px;align-items:center;margin-top:0;margin-bottom:20px;">
                        <button type="button" id="global-css-import-btn" class="btn btn-neutral" style="flex:1;min-width:0;margin:0;">导入</button>
                        <button type="button" id="global-css-export-btn" class="btn btn-neutral" style="flex:1;min-width:0;margin:0;">导出</button>
                    </div>

                    <button type="button" id="apply-global-css-now-btn" class="btn btn-primary" style="margin-top: 0; margin-bottom: 15px;">保存并应用</button>
                </div>
            </div>
            `;
            customizeForm.insertAdjacentHTML('beforeend', globalCssSectionHTML);

            // 填充预设下拉框
            populateGlobalCssPresetSelect();

            // 初始化壁纸预览
            const wallpaperPreviewCustomize = document.getElementById('wallpaper-preview-customize');
            if (wallpaperPreviewCustomize) {
                wallpaperPreviewCustomize.style.backgroundImage = `url(${db.wallpaper})`;
                wallpaperPreviewCustomize.textContent = '';
            }

            // [新增] 辅助函数，用于应用预设到输入框和实时预览
            const applyGlobalCssPreset = (presetName) => {
                const globalCssTextarea = document.getElementById('global-beautification-css');
                const preset = (db.globalCssPresets || []).find(p => p.name === presetName);
                if (preset && globalCssTextarea) {
                    globalCssTextarea.value = preset.css;
                    applyGlobalCss(preset.css); // [新增] 实时预览
                    showToast(`已预览 "${presetName}"`);
                } else if (presetName === '') {
                    // 如果用户选回 "— 选择预设 —"
                    globalCssTextarea.value = '';
                    applyGlobalCss(db.globalCss); // 恢复到已保存的 CSS
                }
            };

            // [新增] 为 CSS 预设下拉框添加 'change' 事件监听器
            const globalCssPresetSelect = document.getElementById('global-css-preset-select');
            if (globalCssPresetSelect) {
                globalCssPresetSelect.addEventListener('change', () => {
                    applyGlobalCssPreset(globalCssPresetSelect.value);
                });
            }

            // --- 新增：为所有折叠标题添加一个点击事件监听器 ---
            customizeForm.querySelectorAll('.collapsible-header').forEach(header => {
                header.addEventListener('click', () => {
                   header.parentElement.classList.toggle('open');
                });
            });

            // 重新绑定之前已有的事件监听器
            const globalCssTextarea = document.getElementById('global-beautification-css');
            if (globalCssTextarea) {
                globalCssTextarea.value = db.globalCss || '';
            }
    
            // --- NEW: Update Log Functions ---
            function renderUpdateLog() {
                const tutorialContent = document.getElementById('tutorial-content-area');
                if (!tutorialContent) return;
    
                const updateSection = document.createElement('div');
                updateSection.className = 'tutorial-item'; // Use tutorial-item class, default closed
    
                let notesHtml = '';
                updateLog.forEach((log, index) => {
                    const isLast = index === updateLog.length - 1; // 判断是否为最后一项
                    notesHtml += `
                        <div style="margin-bottom: ${isLast ? '0' : '15px'}; ${!isLast ? 'padding-bottom: 10px; border-bottom: 1px solid #f0f0f0;' : ''}">
                            <h4 style="font-size: 15px; color: #333; margin: 0 0 5px 0;">版本 ${log.version} (${log.date})</h4>
                            <ul style="padding-left: 20px; margin: 0; list-style-type: '› ';">
                                ${log.notes.map(note => `<li style="margin-bottom: 5px; color: #666;">${note}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                });
    
                updateSection.innerHTML = `
                    <div class="tutorial-header">更新日志</div>
                    <div class="tutorial-content">
                        ${notesHtml}
                    </div>
                `;
                
                tutorialContent.appendChild(updateSection);
            }
    
            function showUpdateModal() {
                const modal = document.getElementById('update-log-modal');
                const contentEl = document.getElementById('update-log-modal-content');
                const closeBtn = document.getElementById('close-update-log-modal');
    
                const latestLog = updateLog[0];
                if (!latestLog) return;
    
                contentEl.innerHTML = `
                    <h4>版本 ${latestLog.version} (${latestLog.date})</h4>
                    <ul>
                        ${latestLog.notes.map(note => `<li>${note}</li>`).join('')}
                    </ul>
                    <p style="font-size: 12px; color: #888; text-align: center; margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">过往更新说明可在“教程”应用内查看。</p>
                `;
    
                modal.classList.add('visible');
    
                closeBtn.onclick = () => {
                    modal.classList.remove('visible');
                    localStorage.setItem('lastSeenVersion', appVersion);
                };
            }
    
            function checkForUpdates() {
                const lastSeenVersion = localStorage.getItem('lastSeenVersion');
                if (lastSeenVersion !== appVersion) {
                    // Use a small delay to ensure the main UI has rendered
                    setTimeout(showUpdateModal, 500);
                }
            }
            const applyGlobalCssNowBtn = document.getElementById('apply-global-css-now-btn');
            if (applyGlobalCssNowBtn) {
                applyGlobalCssNowBtn.addEventListener('click', async () => {
                    const newCss = globalCssTextarea.value;
                    db.globalCss = newCss;
                    applyGlobalCss(newCss);
                    await saveData();
                    showToast('全局样式已应用');
                });
            }
            const globalCssSaveBtn = document.getElementById('global-css-save-btn');
            if (globalCssSaveBtn) {
                 globalCssSaveBtn.addEventListener('click', () => {
                    const css = globalCssTextarea.value.trim();
                    if (!css) return showToast('CSS内容为空，无法保存');
                    const name = prompt('请输入此预设的名称（同名将覆盖）:');
                    if (!name) return;
                    if (!db.globalCssPresets) db.globalCssPresets = [];
                    const existingIndex = db.globalCssPresets.findIndex(p => p.name === name);
                    if (existingIndex > -1) {
                        db.globalCssPresets[existingIndex].css = css;
                    } else {
                        db.globalCssPresets.push({ name, css });
                    }
                    saveData();
                    populateGlobalCssPresetSelect();
                    showToast('全局CSS预设已保存');
                });
            }
            const globalCssManageBtn = document.getElementById('global-css-manage-btn');
            if (globalCssManageBtn) {
                 globalCssManageBtn.addEventListener('click', openGlobalCssManageModal);
            }
            const globalCssImportBtn = document.getElementById('global-css-import-btn');
            if (globalCssImportBtn) {
                globalCssImportBtn.addEventListener('click', importGlobalCssPresets);
            }
            const globalCssExportBtn = document.getElementById('global-css-export-btn');
            if (globalCssExportBtn) {
                globalCssExportBtn.addEventListener('click', exportGlobalCssPresets);
            }
        }


        function setupTutorialApp() {
            const tutorialContentArea = document.getElementById('tutorial-content-area');
            // 检查是否已经绑定过，防止重复
            if (tutorialContentArea && !tutorialContentArea._listenerAttached) {
                tutorialContentArea.addEventListener('click', (e) => {
                    const header = e.target.closest('.tutorial-header');
                    if (header) {
                        header.parentElement.classList.toggle('open');
                    }
                });
                // 添加一个标志位，表示已经绑定过了
                tutorialContentArea._listenerAttached = true;
            }
            renderTutorialContent();
        }

        // --- NEW: Update Log Functions ---
        function renderUpdateLog() {
            const tutorialContent = document.getElementById('tutorial-content-area');
            if (!tutorialContent) return;

            const updateSection = document.createElement('div');
            updateSection.className = 'tutorial-item'; // Use tutorial-item class, default closed

            let notesHtml = '';
            updateLog.forEach((log, index) => {
                notesHtml += `
                    <div style="margin-bottom: 15px; ${index < updateLog.length - 1 ? 'padding-bottom: 10px; border-bottom: 1px solid #f0f0f0;' : ''}">
                        <h4 style="font-size: 15px; color: #333; margin: 0 0 5px 0;">版本 ${log.version} (${log.date})</h4>
                        <ul style="padding-left: 20px; margin: 0; list-style-type: '› ';">
                            ${log.notes.map(note => `<li style="margin-bottom: 5px; color: #666;">${note}</li>`).join('')}
                        </ul>
                    </div>
                `;
            });

            updateSection.innerHTML = `
                <div class="tutorial-header">更新日志</div>
                <div class="tutorial-content">
                    ${notesHtml}
                </div>
            `;
            
            tutorialContent.appendChild(updateSection);
        }

        function showUpdateModal() {
            const modal = document.getElementById('update-log-modal');
            const contentEl = document.getElementById('update-log-modal-content');
            const closeBtn = document.getElementById('close-update-log-modal');

            const latestLog = updateLog[0];
            if (!latestLog) return;

            contentEl.innerHTML = `
                <h4>版本 ${latestLog.version} (${latestLog.date})</h4>
                <ul>
                    ${latestLog.notes.map(note => `<li>${note}</li>`).join('')}
                </ul>
                <p style="font-size: 12px; color: #888; text-align: center; margin-top: 15px; border-top: 1px solid #eee; padding-top: 10px;">过往更新说明可在“教程”应用内查看。</p>
            `;

            modal.classList.add('visible');

            closeBtn.onclick = () => {
                modal.classList.remove('visible');
                localStorage.setItem('lastSeenVersion', appVersion);
            };
        }

        function checkForUpdates() {
            const lastSeenVersion = localStorage.getItem('lastSeenVersion');
            if (lastSeenVersion !== appVersion) {
                // Use a small delay to ensure the main UI has rendered
                setTimeout(showUpdateModal, 500);
            }
        }
        let loadingBtn = false

        // --- Chat List & Chat Room ---
        function setupChatListScreen() {
            renderChatList();
            addChatBtn.addEventListener('click', () => {
                addCharModal.classList.add('visible');
                addCharForm.reset();
            });

            // --- 新增：导入角色卡按钮事件 ---
            const importBtn = document.getElementById('import-character-card-btn');
            const cardInput = document.getElementById('character-card-input');
            importBtn.addEventListener('click', () => {
                cardInput.click();
            });
            cardInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    handleCharacterImport(file);
                }
                // 重置输入框，以便可以再次选择相同的文件
                e.target.value = null;
            });
            // --- 新增结束 ---
            chatListContainer.addEventListener('click', (e) => {
                const chatItem = e.target.closest('.chat-item');
                if (chatItem) {
                    currentChatId = chatItem.dataset.id;
                    currentChatType = chatItem.dataset.type;
                    openChatRoom(currentChatId, currentChatType);
                }
            });
            chatListContainer.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const chatItem = e.target.closest('.chat-item');
                if (!chatItem) return;
                handleChatListLongPress(chatItem.dataset.id, chatItem.dataset.type, e.clientX, e.clientY);
            });
            chatListContainer.addEventListener('touchstart', (e) => {
                const chatItem = e.target.closest('.chat-item');
                if (!chatItem) return;
                longPressTimer = setTimeout(() => {
                    const touch = e.touches[0];
                    handleChatListLongPress(chatItem.dataset.id, chatItem.dataset.type, touch.clientX, touch.clientY);
                }, 400);
            });
            chatListContainer.addEventListener('touchend', () => clearTimeout(longPressTimer));
            chatListContainer.addEventListener('touchmove', () => clearTimeout(longPressTimer));
        }

        function handleChatListLongPress(chatId, chatType, x, y) {
            clearTimeout(longPressTimer);
            const chatItem = (chatType === 'private') ? db.characters.find(c => c.id === chatId) : db.groups.find(g => g.id === chatId);
            if (!chatItem) return;
            const itemName = chatType === 'private' ? chatItem.remarkName : chatItem.name;
            const menuItems = [{
                label: chatItem.isPinned ? '取消置顶' : '置顶聊天',
                action: async () => {
                    chatItem.isPinned = !chatItem.isPinned;
                    await saveData();
                    renderChatList();
                }
            }, {
                label: '删除聊天',
                danger: true,
                action: async () => {
                    if (confirm(`确定要删除与“${itemName}”的聊天记录吗？此操作不可恢复。`)) {
                        if (chatType === 'private') {
                            await dexieDB.characters.delete(chatId);
                            db.characters = db.characters.filter(c => c.id !== chatId);
                        } else {
                            await dexieDB.groups.delete(chatId);
                            db.groups = db.groups.filter(g => g.id !== chatId);
                        }
                        // No need to call saveData() as we've directly manipulated the DB and in-memory object.
                        renderChatList();
                        showToast('聊天已删除');
                    }
                }
            }];
            createContextMenu(menuItems, x, y);
        }

        function renderChatList() {
            chatListContainer.innerHTML = '';
            const allChats = [...db.characters.map(c => ({...c, type: 'private'})), ...db.groups.map(g => ({
                ...g,
                type: 'group'
            }))];
            noChatsPlaceholder.style.display = (db.characters.length + db.groups.length) === 0 ? 'block' : 'none';
            const sortedChats = allChats.sort((a, b) => {
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                const lastMsgTimeA = a.history && a.history.length > 0 ? a.history[a.history.length - 1].timestamp : 0;
                const lastMsgTimeB = b.history && b.history.length > 0 ? b.history[b.history.length - 1].timestamp : 0;
                return lastMsgTimeB - lastMsgTimeA;
            });
            sortedChats.forEach(chat => {
                let lastMessageText = '开始聊天吧...';
                if (chat.history && chat.history.length > 0) {
                    const invisibleRegex = /\[.*?(?:接收|退回).*?的转账\]|\[.*?更新状态为：.*?\]|\[.*?已接收礼物\]|\[system:.*?\]|\[.*?邀请.*?加入了群聊\]|\[.*?修改群名为：.*?\]|\[system-display:.*?\]/;
                    const visibleHistory = chat.history.filter(msg => !invisibleRegex.test(msg.content));
                    if (visibleHistory.length > 0) {
                        const lastMsg = visibleHistory[visibleHistory.length - 1];
                        const urlRegex = /^(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg)|data:image\/[a-z]+;base64,)/i;
                        const imageRecogRegex = /\[.*?发来了一张图片(?:：|:)\]/
                        const voiceRegex = /\[.*?的语音(?:：|:).*?\]/;
                        const photoVideoRegex = /\[.*?发来的照片\/视频(?:：|:).*?\]/;
                        const transferRegex = /\[.*?的转账(?:：|:).*?元.*?\]|\[.*?给你转账(?:：|:).*?元.*?\]|\[.*?向.*?转账(?:：|:).*?元.*?\]/;
                        const stickerRegex = /\[.*?的表情包(?:：|:).*?\]|\[.*?发送的表情包(?:：|:).*?\]/;
                        const giftRegex = /\[.*?送来的礼物(?:：|:).*?\]|\[.*?向.*?送来了礼物(?:：|:).*?\]/;
                        // ▼▼▼ 新增 NAI 预览规则 ▼▼▼
                        const naiRegex = /\[.*?的消息(?:：|:)NAI 正在作画中... 🎨\]/;
                        // ▲▲▲ 新增结束 ▲▲▲

                        if (giftRegex.test(lastMsg.content)) {
                            lastMessageText = '[礼物]';
                        // ▼▼▼ 新增 NAI 渲染规则 ▼▼▼
                        } else if (lastMsg.type === 'naiimag') {
                            lastMessageText = '[NovelAI图片]';
                        } else if (naiRegex.test(lastMsg.content)) {
                            lastMessageText = 'NAI 正在作画中... 🎨';
                        // ▲▲▲ 新增结束 ▲▲▲
                        } else if (stickerRegex.test(lastMsg.content)) {
                            lastMessageText = '[表情包]';
                        } else if (voiceRegex.test(lastMsg.content)) {
                            lastMessageText = '[语音]';
                        } else if (photoVideoRegex.test(lastMsg.content)) {
                            lastMessageText = '[照片/视频]';
                        } else if (transferRegex.test(lastMsg.content)) {
                            lastMessageText = '[转账]';
                        } else if (imageRecogRegex.test(lastMsg.content) || (lastMsg.parts && lastMsg.parts.some(p => p.type === 'image'))) {
                            lastMessageText = '[图片]';
                        }else if ((lastMsg.parts && lastMsg.parts.some(p => p.type === 'html'))) {
                            lastMessageText = '[互动]';
                        } else {
                            const textMatch = lastMsg.content.match(/\[.*?的消息(?:：|:)([\s\S]+)\]/);
                            // ...
let text = lastMsg.content.trim();
const plainTextMatch = text.match(/^\[.*?(?:：|:)([\s\S]*)\]$/);
if (plainTextMatch && plainTextMatch[1]) {
    text = plainTextMatch[1].trim();
}
text = text.replace(/\[发送时间:.*?\]$/, '').trim(); // 擦掉时间戳
const htmlRegex = /<[a-z][\s\S]*>/i;
if (htmlRegex.test(text)) {
    lastMessageText = '[互动]';
} else {
    lastMessageText = urlRegex.test(text) ? '[图片]' : text;
}
                        }
                    } else {
                        const lastEverMsg = chat.history[chat.history.length - 1];
                        const inviteRegex = /\[(.*?)邀请(.*?)加入了群聊\]/;
                        const renameRegex = /\[.*?修改群名为：.*?\]/;
                        const timeSkipRegex = /\[system-display:([\s\S]+?)\]/;
                        const timeSkipMatch = lastEverMsg.content.match(timeSkipRegex);

                        if (timeSkipMatch) {
                            lastMessageText = timeSkipMatch[1];
                        } else if (inviteRegex.test(lastEverMsg.content)) {
                            lastMessageText = '新成员加入了群聊';
                        } else if (renameRegex.test(lastEverMsg.content)) {
                            lastMessageText = '群聊名称已修改';
                            } else {
                            lastMessageText = 'ta正在等你';
                        }
                        
                    }
                }
                const li = document.createElement('li');
                li.className = 'list-item chat-item';
                if (chat.isPinned) li.classList.add('pinned');
                li.dataset.id = chat.id;
                li.dataset.type = chat.type;
                const avatarClass = chat.type === 'group' ? 'group-avatar' : '';
                const itemName = chat.type === 'private' ? chat.remarkName : chat.name;
                const pinBadgeHTML = chat.isPinned ? '<span class="pin-badge">置顶</span>' : '';
let timeString = '';
const lastMessage = chat.history && chat.history.length > 0 ? chat.history[chat.history.length - 1] : null;
if (lastMessage) {
    const date = new Date(lastMessage.timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        timeString = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } else {
        timeString = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }
}

const unreadCount = chat.unreadCount || 0;
const unreadBadgeHTML = unreadCount > 0 
    ? `<span class="unread-badge visible">${unreadCount > 99 ? '99+' : unreadCount}</span>`
    : `<span class="unread-badge"></span>`;

li.innerHTML = `
<img src="${chat.avatar}" alt="${itemName}" class="chat-avatar ${avatarClass}">
<div class="item-details">
    <div class="item-details-row">
        <div class="item-name">${itemName}</div>
        <div class="item-meta">
            <span class="item-time">${timeString}</span>
        </div>
    </div>
    <div class="item-preview-wrapper">
        <div class="item-preview">${lastMessageText}</div>
        ${pinBadgeHTML}
    </div>
</div>
${unreadBadgeHTML}`; /* <-- 将红点元素移动到这里 */


                chatListContainer.appendChild(li);
            });
        }

        function setupAddCharModal() {
            addCharForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newChar = {
                    id: `char_${Date.now()}`,
                    realName: document.getElementById('char-real-name').value,
                    remarkName: document.getElementById('char-remark-name').value,
                    persona: '',
                    avatar: 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg',
                    myName: document.getElementById('my-name-for-char').value,
                    myPersona: '',
                    myAvatar: 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg',
                    theme: 'white_pink',
                    maxMemory: 10,
                    chatBg: '',
                    history: [],
                    isPinned: false,
                    status: '在线',
                    worldBookIds: [],
                    useCustomBubbleCss: false,
                    customBubbleCss: '',
                    unreadCount: 0,
                    memoryJournals: [],
                    journalWorldBookIds: [], // 新增
                    peekScreenSettings: { wallpaper: '', customIcons: {}, unlockAvatar: '' }, // 新增
                    lastUserMessageTimestamp: null, // 新增：用于记录最后消息时间
                    // ▼▼▼ 新增 ▼▼▼
                    naiSettings: {}, // 用于存储 source
                    naiModuleIds: [] // 用于存储勾选
                    // ▲▲▲ 新增结束 ▲▲▲
               };
                db.characters.push(newChar);
                await saveData();
                renderChatList();
                addCharModal.classList.remove('visible');
                showToast(`角色“${newChar.remarkName}”创建成功！`);
                promptForBackupIfNeeded('new_char');
            });
        }

        function setupChatRoom() {
            const placeholderPlusBtn = document.getElementById('placeholder-plus-btn');
            const chatExpansionPanel = document.getElementById('chat-expansion-panel');

            placeholderPlusBtn.addEventListener('click', () => {
                // Hide sticker modal if open
                if (stickerModal.classList.contains('visible')) {
                    stickerModal.classList.remove('visible');
                }
                chatExpansionPanel.classList.toggle('visible');
            });

            sendMessageBtn.addEventListener('click', sendMessage);
            sendMessageBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                sendMessage();
                setTimeout(() => {
                    messageInput.focus();
                }, 50);
            });
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !isGenerating) sendMessage();
            });
            getReplyBtn.addEventListener('click', () => getAiReply(currentChatId, currentChatType));
            regenerateBtn.addEventListener('click', handleRegenerate);
            messageArea.addEventListener('click', (e) => {
                // --- Close any open panels when clicking message area ---
                if (stickerModal.classList.contains('visible')) {
                    stickerModal.classList.remove('visible');
                    return;
                }
                if (chatExpansionPanel.classList.contains('visible')) {
                    chatExpansionPanel.classList.remove('visible');
                    return;
                }
                // --- End close panels ---

                // 处理 NAI 重新生成按钮点击
                if (e.target.closest('.nai-regenerate-btn')) {
                    const button = e.target.closest('.nai-regenerate-btn');
                    const wrapper = e.target.closest('.message-wrapper');
                    
                    if (wrapper && wrapper.dataset.id) {
                        const messageId = wrapper.dataset.id;
                        const chat = (currentChatType === 'private') 
                            ? db.characters.find(c => c.id === currentChatId) 
                            : db.groups.find(g => g.id === currentChatId);
                        
                        if (chat) {
                            const message = chat.history.find(m => m.id === messageId);
                            
                            if (message && message.type === 'naiimag') {
                                // 调用我们从 ephone 复制来的函数
                                handleRegenerateNaiImage(message.timestamp, button);
                            }
                        }
                    }
                    return;
                }

                if (e.target && e.target.id === 'load-more-btn') {
                    loadMoreMessages();
                } else if (isInMultiSelectMode) {
                    const messageWrapper = e.target.closest('.message-wrapper');
                    if (messageWrapper) {
                        toggleMessageSelection(messageWrapper.dataset.id);
                    }
                } else {
                    const voiceBubble = e.target.closest('.voice-bubble');
                    if (voiceBubble) {
                        const transcript = voiceBubble.closest('.message-wrapper').querySelector('.voice-transcript');
                        if (transcript) {
                            transcript.classList.toggle('active');
                        }
                    }
                    const pvCard = e.target.closest('.pv-card');
                    if (pvCard) {
                        const imageOverlay = pvCard.querySelector('.pv-card-image-overlay');
                        const footer = pvCard.querySelector('.pv-card-footer');
                        imageOverlay.classList.toggle('hidden');
                        footer.classList.toggle('hidden');
                    }
                    const giftCard = e.target.closest('.gift-card');
                    if (giftCard) {
                        const description = giftCard.closest('.message-wrapper').querySelector('.gift-card-description');
                        if (description) {
                            description.classList.toggle('active');
                        }
                    }
                    const transferCard = e.target.closest('.transfer-card.received-transfer');
                    if (transferCard && currentChatType === 'private') {
                        const messageWrapper = transferCard.closest('.message-wrapper');
                        const messageId = messageWrapper.dataset.id;
                        const character = db.characters.find(c => c.id === currentChatId);
                        const message = character.history.find(m => m.id === messageId);
                        if (message && message.transferStatus === 'pending') {
                            handleReceivedTransferClick(messageId);
                        }
                    }
                }
            });
            messageArea.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (e.target.id === 'load-more-btn' || isInMultiSelectMode) return;
                const messageWrapper = e.target.closest('.message-wrapper');
                if (!messageWrapper) return;
                handleMessageLongPress(messageWrapper, e.clientX, e.clientY);
            });
            messageArea.addEventListener('touchstart', (e) => {
                if (e.target.id === 'load-more-btn') return;
                const messageWrapper = e.target.closest('.message-wrapper');
                if (!messageWrapper) return;
                longPressTimer = setTimeout(() => {
                    const touch = e.touches[0];
                    handleMessageLongPress(messageWrapper, touch.clientX, touch.clientY);
                }, 400);
            });
            messageArea.addEventListener('touchend', () => clearTimeout(longPressTimer));
            messageArea.addEventListener('touchmove', () => clearTimeout(longPressTimer));
            
            const messageEditForm = document.getElementById('message-edit-form');
            if(messageEditForm) {
                messageEditForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    saveMessageEdit();
                });
            }

            const cancelEditModalBtn = document.getElementById('cancel-edit-modal-btn');
            if(cancelEditModalBtn) {
                cancelEditModalBtn.addEventListener('click', cancelMessageEdit);
            }

            cancelMultiSelectBtn.addEventListener('click', exitMultiSelectMode);
            deleteSelectedBtn.addEventListener('click', deleteSelectedMessages);
            
            // 新增：绑定取消引用按钮事件
            document.getElementById('cancel-reply-btn').addEventListener('click', cancelQuoteReply);
        }


        function handleMessageLongPress(messageWrapper, x, y) {
            if (isInMultiSelectMode) return;
            clearTimeout(longPressTimer);
            const messageId = messageWrapper.dataset.id;
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            const message = chat.history.find(m => m.id === messageId);
            if (!message) return;

            const isImageRecognitionMsg = message.parts && message.parts.some(p => p.type === 'image');
            const isVoiceMessage = /\[.*?的语音(?:：|:).*?\]/.test(message.content);
            const isStickerMessage = /\[.*?的表情包(?:：|:).*?\]|\[.*?发送的表情包(?:：|:).*?\]/.test(message.content);
            const isPhotoVideoMessage = /\[.*?发来的照片\/视频(?:：|:).*?\]/.test(message.content);
            const isTransferMessage = /\[.*?给你转账(?:：|:).*?\]|\[.*?的转账(?:：|:).*?\]|\[.*?向.*?转账(?:：|:).*?\]/.test(message.content);
            const isGiftMessage = /\[.*?送来的礼物(?:：|:).*?\]|\[.*?向.*?送来了礼物(?:：|:).*?\]/.test(message.content);
            const isInvisibleMessage = /\[.*?(?:接收|退回).*?的转账\]|\[.*?更新状态为：.*?\]|\[.*?已接收礼物\]|\[system:.*?\]|\[.*?邀请.*?加入了群聊\]|\[.*?修改群名为：.*?\]|\[system-display:.*?\]/.test(message.content);
            const isWithdrawn = message.isWithdrawn; // 新增：检查消息是否已撤回

            let menuItems = [];

            // 如果消息未被撤回，则显示正常菜单
            if (!isWithdrawn) {
                if (!isImageRecognitionMsg && !isVoiceMessage && !isStickerMessage && !isPhotoVideoMessage && !isTransferMessage && !isGiftMessage && !isInvisibleMessage) {
                    menuItems.push({label: '编辑', action: () => startMessageEdit(messageId)});
                }
                
                if (!isInvisibleMessage) {
                    menuItems.push({label: '引用', action: () => startQuoteReply(messageId)});
                }

                // 新增：只有自己发送的消息才能撤回
                if (message.role === 'user') {
                    menuItems.push({label: '撤回', action: () => withdrawMessage(messageId)});
                }
            }

            menuItems.push({label: '删除', action: () => enterMultiSelectMode(messageId)});

            if (menuItems.length > 0) {
                createContextMenu(menuItems, x, y);
            }
        }

        // --- 新增：引用功能相关函数 ---
    function startQuoteReply(messageId) {
        const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
        const message = chat.history.find(m => m.id === messageId);
        if (!message) return;

        // ▼▼▼ 新增：NAI生图消息的特殊引用处理 (V4 - 截断Prompt) ▼▼▼
        if (message.type === 'naiimag') {
            // 1. 确定发送者名称
            let senderName = '';
            if (message.role === 'user') {
                senderName = (currentChatType === 'private') ? chat.myName : chat.me.nickname;
            } else {
                if (currentChatType === 'private') {
                    senderName = chat.remarkName;
                } else {
                    const sender = chat.members.find(m => m.id === message.senderId);
                    senderName = sender ? sender.groupNickname : '群成员';
                }
            }
            
            // 2. 创建自定义的引用预览内容 (读取 prompt 字段并截断)
            const promptText = message.prompt || '图片'; 
            const truncatedPrompt = promptText.length > 50 ? promptText.substring(0, 50) + '...' : promptText;

            // 3. 设置引用信息 (核心：引用内容是截断后的 Prompt)
            currentQuoteInfo = {
                id: message.id,
                senderId: message.senderId || 'user_me', 
                senderName: senderName,
                content: truncatedPrompt // AI看到的引用上下文
            };

            // 4. 显示引用预览条 (您看到的预览)
            const previewBar = document.getElementById('reply-preview-bar');
            previewBar.querySelector('.reply-preview-name').textContent = `回复 ${senderName}`;
            previewBar.querySelector('.reply-preview-text').textContent = currentQuoteInfo.content;
            previewBar.classList.add('visible');
            
            messageInput.focus();
            
            // 5. 终止原函数，防止执行旧的、会导致崩溃的代码
            return; 
        }
        // ▲▲▲ NAI生图消息处理结束 ▲▲▲

        let senderName = '';
        let senderId = '';
        if (message.role === 'user') {
            senderName = (currentChatType === 'private') ? chat.myName : chat.me.nickname;
            senderId = 'user_me';
        } else { // assistant
            if (currentChatType === 'private') {
                senderName = chat.remarkName;
                senderId = chat.id;
            } else {
                const sender = chat.members.find(m => m.id === message.senderId);
                senderName = sender ? sender.groupNickname : '未知成员';
                senderId = sender ? sender.id : 'unknown';
            }
        }
        
        // 提取纯文本内容用于预览
        let previewContent = message.content;
        const textMatch = message.content.match(/\[.*?的消息(?:：|:)([\s\S]+?)\]/);
        if (textMatch) {
            previewContent = textMatch[1];
        } else if (/\[.*?的表情包(?:：|:).*?\]/.test(message.content)) {
            previewContent = '[表情包]';
        } else if (/\[.*?的语音(?:：|:).*?\]/.test(message.content)) {
            previewContent = '[语音]';
        } else if (/\[.*?发来的照片\/视频(?:：|:).*?\]/.test(message.content)) {
            previewContent = '[照片/视频]';
        } else if (message.parts && message.parts.some(p => p.type === 'image')) {
            previewContent = '[图片]';
        }
        
        currentQuoteInfo = {
            id: message.id,
            senderId: senderId,
            senderName: senderName,
            content: previewContent.substring(0, 100) // 截断以防过长
        };

        const previewBar = document.getElementById('reply-preview-bar');
        previewBar.querySelector('.reply-preview-name').textContent = `回复 ${senderName}`;
        previewBar.querySelector('.reply-preview-text').textContent = currentQuoteInfo.content;
        previewBar.classList.add('visible');
        
        messageInput.focus();
    }

    function cancelQuoteReply() {
        currentQuoteInfo = null;
        const previewBar = document.getElementById('reply-preview-bar');
        previewBar.classList.remove('visible');
    }
    // --- 引用功能函数结束 ---

        // --- 升级后的编辑功能（支持普通文本和NAI图片）---
        function startMessageEdit(messageId) {
            exitMultiSelectMode();
            editingMessageId = messageId;
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            const message = chat.history.find(m => m.id === messageId);
            if (!message) return;

            activeMessageTimestamp = message.timestamp; // 关键：设置全局时间戳

            const modal = document.getElementById('message-edit-modal');
            const textarea = document.getElementById('message-edit-textarea');
            const modalTitle = modal ? modal.querySelector('h3') : null;

            if (!modal || !textarea) {
                console.error('找不到编辑弹窗 (message-edit-modal)');
                return;
            }

            if (message.type === 'naiimag') {
                // --- 升级：如果是 NAI 消息 ---
                // 1. 加载 prompt 到输入框
                textarea.value = message.prompt || '';
                // 2. 修改弹窗标题
                if (modalTitle) modalTitle.textContent = '编辑 NAI 提示词';
            } else {
                // --- 原始：如果是普通文本/语音消息 ---
                // 1. 加载 content 到输入框
                let contentToEdit = message.content;
                const plainTextMatch = contentToEdit.match(/^\[.*?：([\s\S]*)\]$/);
                if (plainTextMatch && plainTextMatch[1]) {
                    contentToEdit = plainTextMatch[1].trim();
                }
                contentToEdit = contentToEdit.replace(/\[发送时间:.*?\]/g, '').trim();
                textarea.value = contentToEdit;
                // 2. 恢复弹窗标题
                if (modalTitle) modalTitle.textContent = '编辑消息';
            }
            
            // 3. 显示弹窗
            modal.classList.add('visible');
            textarea.focus();
        }

        async function saveMessageEdit() {
            const modal = document.getElementById('message-edit-modal');
            const textarea = document.getElementById('message-edit-textarea');

            if (!textarea || !activeMessageTimestamp) {
                if (modal) modal.classList.remove('visible');
                return;
            }

            const newContent = textarea.value.trim(); // 这是用户输入的新内容
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            const message = chat.history.find(m => m.timestamp === activeMessageTimestamp);
            
            if (!message) return;

            // 找到对应的聊天气泡，准备更新UI
            const messageWrapper = document.querySelector(`.message-wrapper[data-id="${message.id}"]`);
            const bubbleElement = messageWrapper ? messageWrapper.querySelector('.message-bubble') : null;

            if (message.type === 'naiimag') {
                // --- 升级：NAI 消息的保存逻辑 ---
                
                if (message.prompt === newContent) {
                    // 1. 用户没改 prompt，直接关闭弹窗
                    if (modal) modal.classList.remove('visible');
                    activeMessageTimestamp = null;
                    editingMessageId = null; // <-- 新增这一行
                    return;
                }

                // 2. 用户改了 prompt，立即关闭弹窗并清空状态
                if (modal) modal.classList.remove('visible');
                activeMessageTimestamp = null;
                editingMessageId = null;

                // 3. 在聊天气泡里显示"加载中"
                if (bubbleElement) {
                    bubbleElement.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">🎨 正在重新生成...</div>`;
                }

                // 4. 将生图和保存逻辑放入一个立即执行的异步函数，使其在后台运行
                (async () => {
                    try {
                        // 5. 调用核心生图函数 (await is fine here)
                        const chatId = currentChatId;
                    const result = await generateNaiImageFromPrompt(newContent, chatId); // 使用新 prompt

                    // 5. 更新数据库中的消息
                    message.prompt = newContent; // 保存新 prompt
                    message.imageUrl = result.imageUrl;
                    message.fullPrompt = result.fullPrompt;
                    
                    // ▼▼▼ 新增的修复：同步更新 content 字段 ▼▼▼
                    let senderName = '';
                    if (message.role === 'user') {
                        // 是用户自己发的 !nai
                        senderName = (currentChatType === 'private') ? chat.myName : chat.me.nickname;
                    } else {
                        // 是 AI 主动发的
                        if (currentChatType === 'private') {
                            senderName = chat.remarkName;
                        } else {
                            const sender = chat.members.find(m => m.id === message.senderId);
                            senderName = sender ? sender.groupNickname : '群成员';
                        }
                    }
                    message.content = `[${senderName}的消息：${newContent}]`;
                    // ▲▲▲ 修复结束 ▲▲▲
                    
                    // 6. 在聊天气泡里渲染新图片
                    if (bubbleElement) {
                        bubbleElement.innerHTML = `
                            <div class="nai-image-wrapper">
                                <img src="${result.imageUrl}" class="realimag-image naiimag-image" alt="NovelAI Image" title="${result.fullPrompt}" loading="lazy" onerror="this.src='https://i.postimg.cc/1tH6ds9g/1752301200490.jpg';">
                                <button class="nai-regenerate-btn" title="重新生成">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                        <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                    </svg>
                                </button>
                            </div>`;
                    }

                    // 8. ★★★ 关键：在这里单独保存 NAI 消息的更改 ★★★
                    await saveData();
                    // 9. 刷新列表（可选，但最好有）
                    renderChatList();

                    showToast("图片已根据新提示词重新生成！");
                } catch (error) {
                    console.error('NAI 重新生成失败:', error);
                    if (bubbleElement) {
                        bubbleElement.innerHTML = `<div style="padding: 20px; text-align: center; color: #ff3b30;">[NAI 重新生成失败: ${error.message}]</div>`;
                    }
                    showToast(`无法重新生成图片: ${error.message}`);
                }
            })(); // <-- 立即执行

            // 10. ★★★ 关键：阻止后续的通用保存和关闭逻辑执行 ★★★
            return;

            } else {
                // --- 原始：普通文本消息的保存逻辑 ---
                const oldContent = message.content;
                const prefixMatch = oldContent.match(/(\[.*?的消息(?:：|:))[\s\S]+\]/);
                let finalContent;

                if (prefixMatch && prefixMatch[1]) {
                    const prefix = prefixMatch[1];
                    finalContent = `${prefix}${newContent}]`;
                } else {
                    finalContent = newContent;
                }

                message.content = finalContent;
                
                // 更新 UI
                if (bubbleElement && message.parts) {
                    message.parts = [{type: 'text', text: finalContent}];
                }
            }

            // --- 通用：保存到数据库并关闭弹窗 ---
            await saveData();
            currentPage = 1;
            renderMessages(false, true);
            renderChatList();

            if (modal) modal.classList.remove('visible');
            activeMessageTimestamp = null;
            editingMessageId = null;
        }

        function cancelMessageEdit() {
            editingMessageId = null;
            const modal = document.getElementById('message-edit-modal');
            if (modal) {
                modal.classList.remove('visible');
            }
        }

        function enterMultiSelectMode(initialMessageId) {
            isInMultiSelectMode = true;
            chatRoomHeaderDefault.style.display = 'none';
            chatRoomHeaderSelect.style.display = 'flex';
            document.querySelector('.chat-input-wrapper').style.display = 'none';
            multiSelectBar.classList.add('visible');
            chatRoomScreen.classList.add('multi-select-active');
            selectedMessageIds.clear();
            if (initialMessageId) {
                toggleMessageSelection(initialMessageId);
            }
        }

        function exitMultiSelectMode() {
            isInMultiSelectMode = false;
            chatRoomHeaderDefault.style.display = 'flex';
            chatRoomHeaderSelect.style.display = 'none';
            document.querySelector('.chat-input-wrapper').style.display = 'block';
            multiSelectBar.classList.remove('visible');
            chatRoomScreen.classList.remove('multi-select-active');
            selectedMessageIds.forEach(id => {
                const el = messageArea.querySelector(`.message-wrapper[data-id="${id}"]`);
                if (el) el.classList.remove('multi-select-selected');
            });
            selectedMessageIds.clear();
        }

        function toggleMessageSelection(messageId) {
            const el = messageArea.querySelector(`.message-wrapper[data-id="${messageId}"]`);
            if (!el) return;
            if (selectedMessageIds.has(messageId)) {
                selectedMessageIds.delete(messageId);
                el.classList.remove('multi-select-selected');
            } else {
                selectedMessageIds.add(messageId);
                el.classList.add('multi-select-selected');
            }
            selectCount.textContent = `已选择 ${selectedMessageIds.size} 项`;
            deleteSelectedBtn.disabled = selectedMessageIds.size === 0;
        }

        async function deleteSelectedMessages() {
            if (selectedMessageIds.size === 0) return;
            const deletedCount = selectedMessageIds.size;
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            chat.history = chat.history.filter(m => !selectedMessageIds.has(m.id));
            await saveData();
            currentPage = 1;
            renderMessages(false, true);
            renderChatList();
            exitMultiSelectMode();
            showToast(`已删除 ${deletedCount} 条消息`);
        }

        function openChatRoom(chatId, type) {
            const chat = (type === 'private') ? db.characters.find(c => c.id === chatId) : db.groups.find(g => g.id === chatId);
            if (!chat) return;
                // --- 从这里开始是新增的代码 ---
            if (chat.unreadCount && chat.unreadCount > 0) {
                chat.unreadCount = 0;
                saveData();
                renderChatList(); // 重新渲染列表，清除红点
            }
    // --- 新增代码结束 ---
            exitMultiSelectMode();
            cancelMessageEdit();
            chatRoomTitle.textContent = (type === 'private') ? chat.remarkName : chat.name;
            const subtitle = document.getElementById('chat-room-subtitle');
            if (type === 'private') {
                subtitle.style.display = 'flex';
                chatRoomStatusText.textContent = chat.status || '在线';
            } else {
                subtitle.style.display = 'none';
            }
            getReplyBtn.style.display = 'inline-flex';
            chatRoomScreen.style.backgroundImage = chat.chatBg ? `url(${chat.chatBg})` : 'none';
            typingIndicator.style.display = 'none';
            isGenerating = false;
            getReplyBtn.disabled = false;
            currentPage = 1;
            chatRoomScreen.className = chatRoomScreen.className.replace(/\bchat-active-[^ ]+\b/g, '');
            chatRoomScreen.classList.add(`chat-active-${chatId}`);
            updateCustomBubbleStyle(chatId, chat.customBubbleCss, chat.useCustomBubbleCss);
            renderMessages(false, true);
            switchScreen('chat-room-screen');
        }

        function renderMessages(isLoadMore = false, forceScrollToBottom = false) {
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            if (!chat || !chat.history) return;
            const oldScrollHeight = messageArea.scrollHeight;
            const totalMessages = chat.history.length;
            const end = totalMessages - (currentPage - 1) * MESSAGES_PER_PAGE;
            const start = Math.max(0, end - MESSAGES_PER_PAGE);
            const messagesToRender = chat.history.slice(start, end);
            if (!isLoadMore) messageArea.innerHTML = '';
            const fragment = document.createDocumentFragment();
            messagesToRender.forEach(msg => {
                const bubble = createMessageBubbleElement(msg);
                if (bubble) fragment.appendChild(bubble);
            });
            const existingLoadBtn = document.getElementById('load-more-btn');
            if (existingLoadBtn) existingLoadBtn.remove();
            messageArea.prepend(fragment);
            if (totalMessages > currentPage * MESSAGES_PER_PAGE) {
                const loadMoreButton = document.createElement('button');
                loadMoreButton.id = 'load-more-btn';
                loadMoreButton.className = 'load-more-btn';
                loadMoreButton.textContent = '加载更早的消息';
                messageArea.prepend(loadMoreButton);
            }
            if (forceScrollToBottom) {
                setTimeout(() => {
                    messageArea.scrollTop = messageArea.scrollHeight;
                }, 0);
            } else if (isLoadMore) {
                messageArea.scrollTop = messageArea.scrollHeight - oldScrollHeight;
            }
        }

        function loadMoreMessages() {
            currentPage++;
            renderMessages(true, false);
        }

        function calculateVoiceDuration(text) {
            return Math.max(1, Math.min(60, Math.ceil(text.length / 3.5)));
        }

        function createMessageBubbleElement(message) {
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            const {role, content, timestamp, id, transferStatus, giftStatus, stickerData, senderId, quote, isWithdrawn, originalContent} = message;

            const wrapper = document.createElement('div');
            wrapper.dataset.id = id;

            if (isWithdrawn) {
                wrapper.className = 'message-wrapper system-notification';
                const withdrawnText = (role === 'user') ? '你撤回了一条消息' : `${chat.remarkName || chat.name}撤回了一条消息`;

                wrapper.innerHTML = `
                    <div>
                        <span class="withdrawn-message">${withdrawnText}</span>
                    </div>
                    <div class="withdrawn-content">${originalContent ? DOMPurify.sanitize(originalContent) : ''}</div>
                `;

                const withdrawnMessageSpan = wrapper.querySelector('.withdrawn-message');
                if (withdrawnMessageSpan) {
                    withdrawnMessageSpan.addEventListener('click', () => {
                        const withdrawnContent = wrapper.querySelector('.withdrawn-content');
                        if (withdrawnContent && withdrawnContent.textContent.trim()) {
                            withdrawnContent.classList.toggle('active');
                        }
                    });
                }
                return wrapper;
            }

            const timeSkipRegex = /\[system-display:([\s\S]+?)\]/;
            const inviteRegex = /\[(.*?)邀请(.*?)加入了群聊\]/;
            const renameRegex = /\[(.*?)修改群名为：(.*?)\]/;
            const timeSkipMatch = content.match(timeSkipRegex);
            const inviteMatch = content.match(inviteRegex);
            const renameMatch = content.match(renameRegex);
            const invisibleRegex = /\[.*?(?:接收|退回).*?的转账\]|\[.*?更新状态为：.*?\]|\[.*?已接收礼物\]|\[system:.*?\]|\[系统情景通知：.*?\]/;
            if (invisibleRegex.test(content)) {
                return null;
            }

            if (timeSkipMatch || inviteMatch || renameMatch) {
                wrapper.className = 'message-wrapper system-notification';
                let bubbleText = '';
                if (timeSkipMatch) bubbleText = timeSkipMatch[1];
                if (inviteMatch) bubbleText = `${inviteMatch[1]}邀请${inviteMatch[2]}加入了群聊`;
                if (renameMatch) bubbleText = `${renameMatch[1]}修改群名为“${renameMatch[2]}”`;
                wrapper.innerHTML = `<div class="system-notification-bubble">${bubbleText}</div>`;
                return wrapper;
            }

            const isSent = (role === 'user');
            let avatarUrl, bubbleTheme, senderNickname = '';
            const themeKey = chat.theme || 'white_pink';
            const theme = colorThemes[themeKey] || colorThemes['white_pink'];
            let messageSenderId = isSent ? 'user_me' : senderId;

            if (isSent) {
                avatarUrl = (currentChatType === 'private') ? chat.myAvatar : chat.me.avatar;
                bubbleTheme = theme.sent;
            } else {
                if (currentChatType === 'private') {
                    avatarUrl = chat.avatar;
                } else { // Group chat received
                    const sender = chat.members.find(m => m.id === senderId);
                    if (sender) {
                        avatarUrl = sender.avatar;
                        senderNickname = sender.groupNickname;
                    } else { // Fallback for unknown sender
                        avatarUrl = 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg';
                    }
                }
                bubbleTheme = theme.received;
            }
            const timeString = `${pad(new Date(timestamp).getHours())}:${pad(new Date(timestamp).getMinutes())}`;
            wrapper.className = `message-wrapper ${isSent ? 'sent' : 'received'}`;
            if (currentChatType === 'group' && !isSent) {
                wrapper.classList.add('group-message');
            }
            const bubbleRow = document.createElement('div');
            bubbleRow.className = 'message-bubble-row';
            let bubbleElement;

            // Regexes for all message types
            const urlRegex = /^(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp|bmp|svg)|data:image\/[a-z]+;base64,)/i;
            const sentStickerRegex = /\[(?:.+?)的表情包(?:：|:).+?\]/i;
            const receivedStickerRegex = /\[(?:.+?)发送的表情包(?:：|:)([\s\S]+?)\]/i;
            const voiceRegex = /\[(?:.+?)的语音(?:：|:)([\s\S]+?)\]/;
            const photoVideoRegex = /\[(?:.+?)发来的照片\/视频(?:：|:)([\s\S]+?)\]/;
            const privateSentTransferRegex = /\[.*?给你转账(?:：|:)([\d.]+)元；备注：(.*?)\]/;
            const privateReceivedTransferRegex = /\[.*?的转账(?:：|:)([\d.]+)元；备注：(.*?)\]/;
            const groupTransferRegex = /\[(.*?)\s*向\s*(.*?)\s*转账(?:：|:)([\d.]+)元；备注：(.*?)\]/;
            const privateGiftRegex = /\[(?:.+?)送来的礼物(?:：|:)([\s\S]+?)\]/;
            const groupGiftRegex = /\[(.*?)\s*向\s*(.*?)\s*送来了礼物(?:：|:)([\s\S]+?)\]/;
            const imageRecogRegex = /\[.*?发来了一张图片(?:：|:)\]/;
            const textRegex = /\[(?:.+?)的消息(?:：|:)([\s\S]+)\]/; // 修复：移除了第二个 [\s\S]+? 中的 ?，使其变为贪婪匹配

            const sentStickerMatch = content.match(sentStickerRegex);
            const receivedStickerMatch = content.match(receivedStickerRegex);
            const voiceMatch = content.match(voiceRegex);
            const photoVideoMatch = content.match(photoVideoRegex);
            const privateSentTransferMatch = content.match(privateSentTransferRegex);
            const privateReceivedTransferMatch = content.match(privateReceivedTransferRegex);
            const groupTransferMatch = content.match(groupTransferRegex);
            const privateGiftMatch = content.match(privateGiftRegex);
            const groupGiftMatch = content.match(groupGiftRegex);
            const imageRecogMatch = content.match(imageRecogRegex);
            const textMatch = content.match(textRegex);
            const pomodoroRecordRegex = /\[专注记录\]\s*任务：([\s\S]+?)，时长：([\s\S]+?)，期间与 .*? 互动 (\d+)\s*次。/;
            const pomodoroMatch = content.match(pomodoroRecordRegex);

            if (pomodoroMatch) {
                const taskName = pomodoroMatch[1];
                const duration = pomodoroMatch[2];
                const pokeCount = pomodoroMatch[3];

                bubbleElement = document.createElement('div');
                bubbleElement.className = 'pomodoro-record-card';
                
                const details = { taskName, duration, pokeCount };
                
                bubbleElement.innerHTML = `
                    <img src="https://i.postimg.cc/sgdS9khZ/chan-122.png" class="pomodoro-record-icon" alt="pomodoro complete">
                    <div class="pomodoro-record-body">
                        <p class="task-name">${taskName}</p>
                    </div>
                `;


                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'pomodoro-record-details';
                detailsDiv.innerHTML = `
                    <p><strong>任务名称:</strong> ${taskName}</p>
                    <p><strong>专注时长:</strong> ${duration}</p>
                    <p><strong>“戳一戳”次数:</strong> ${pokeCount}</p>
                `;
                wrapper.appendChild(detailsDiv);

                bubbleElement.addEventListener('click', () => {
                    detailsDiv.classList.toggle('active');
                });

            } else if (message.type === 'naiimag') {
                // ▼▼▼ 新增：NovelAI 图片渲染逻辑（含重新生成按钮）▼▼▼
                // 使用 ephone 的 HTML 结构，包含 wrapper 和 regenerate 按钮

                bubbleElement = document.createElement('div');
                // 添加 ephone 的样式类
                bubbleElement.className = 'message-bubble ' + (isSent ? 'sent' : 'received') + ' is-realimag'; 

                // 使用 ephone 的 HTML 结构，包含 wrapper 和 regenerate 按钮
                bubbleElement.innerHTML = `
                    <div class="nai-image-wrapper">
                        <img src="${message.imageUrl || 'https://i.postimg.cc/1tH6ds9g/1752301200490.jpg'}" 
                             class="realimag-image naiimag-image" 
                             alt="NovelAI Image" 
                             title="${message.fullPrompt || message.prompt || 'NAI Image'}"
                             onerror="this.src='https://i.postimg.cc/1tH6ds9g/1752301200490.jpg';"
                             loading="lazy">
                        
                        <button class="nai-regenerate-btn" title="重新生成">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path>
                            </svg>
                        </button>
                    </div>
                `;
                // ▲▲▲ NovelAI 图片渲染逻辑结束 ▲▲▲

            } else if ((isSent && sentStickerMatch && stickerData) || (!isSent && receivedStickerMatch)) {
                bubbleElement = document.createElement('div');
                bubbleElement.className = 'image-bubble';
                let stickerSrc = '';

                if (isSent) {
                    // 如果是你自己发的表情包，直接使用数据
                    stickerSrc = stickerData;
                } else {
                    // 如果是AI发的表情包，我们需要处理路径
                    // 原始路径，例如："害羞vHLfrV3K/1.jpg"
                            // --- 这是实现您新需求的修改 ---

                    // 1. 检查当前角色的世界书是否包含 'catbox' 关键词
                    let useCatbox = false;
                    if (chat && chat.worldBookIds && chat.worldBookIds.length > 0) {
                        const worldBookContent = chat.worldBookIds
                            .map(id => db.worldBooks.find(wb => wb.id === id))
                            .filter(Boolean)
                            .map(wb => wb.content)
                            .join(' ');

                        if (worldBookContent.toLowerCase().includes('catbox')) {
                            useCatbox = true;
                        }
                    }

                    // 2. 根据检查结果，选择图床前缀
                    const imageHost = useCatbox ? 'https://files.catbox.moe/' : 'https://i.postimg.cc/';

                   // 3. 从AI回复中获取原始路径
                    const rawPath = receivedStickerMatch[2].trim();
        
                                        // 4. 关键: 根据图床选择不同的路径处理方式
                    let finalPath;
                    if (useCatbox) {
                        // 对于 Catbox，AI返回 "情绪+文件名" (例如 "焦虑2a9wte.jpeg")
                        // 我们需要用正则从中提取出真正的文件名 (例如 "2a9wte.jpeg")
                        const catboxFileRegex = /[a-z0-9]+\.(jpeg|png|gif|jpg)$/i;
                        const pathMatch = rawPath.match(catboxFileRegex);
                        
                        if (pathMatch) {
                            finalPath = pathMatch[0]; // 使用匹配到的文件名
                        } else {
                            finalPath = rawPath; // 作为备用方案，如果正则没匹配上
                        }
                    } else {
                        // 对于 postimg 等其他图床，保留原有的提取逻辑
                        const pathExtractionRegex = /[a-zA-Z0-9]+\/.*$/;
                        const extractedPathMatch = rawPath.match(pathExtractionRegex);
                        finalPath = extractedPathMatch ? extractedPathMatch[0] : rawPath;
                    }

                    // 5. 拼接最终URL
                    stickerSrc = `${imageHost}${finalPath}`;
                }

                bubbleElement.innerHTML = `<img src="${stickerSrc}" alt="表情包">`;

            } else if (privateGiftMatch || groupGiftMatch) {
                const match = privateGiftMatch || groupGiftMatch;
                bubbleElement = document.createElement('div');
                bubbleElement.className = 'gift-card';
                if (giftStatus === 'received') {
                    bubbleElement.classList.add('received');
                }

                let giftText;
                if (groupGiftMatch) {
                    const from = groupGiftMatch[1];
                    const to = groupGiftMatch[2];
                    giftText = isSent ? `你送给 ${to} 的礼物` : `${from} 送给 ${to} 的礼物`;
                } else {
                    giftText = isSent ? '您有一份礼物～' : '您有一份礼物～';
                }
                bubbleElement.innerHTML = `<img src="https://i.postimg.cc/rp0Yg31K/chan-75.png" alt="gift" class="gift-card-icon"><div class="gift-card-text">${giftText}</div><div class="gift-card-received-stamp">已查收</div>`;

                const description = groupGiftMatch ? groupGiftMatch[4].trim() : match[2].trim();
                const descriptionDiv = document.createElement('div');
                descriptionDiv.className = 'gift-card-description';
                descriptionDiv.textContent = description;
                wrapper.appendChild(descriptionDiv);
                       } else if (content.startsWith('[论坛分享]')) {
                const forumShareRegex = /\[论坛分享\]标题：([\s\S]+?)\n摘要：([\s\S]+)/;
                const forumShareMatch = content.match(forumShareRegex);

                if (forumShareMatch) {
                    const title = forumShareMatch[1].trim();
                    const summary = forumShareMatch[2].trim();

                    bubbleElement = document.createElement('div');
                    bubbleElement.className = 'forum-share-card';

                    // 这是卡片内部的HTML结构
                    bubbleElement.innerHTML = `
                        <div class="forum-share-header">
                            <svg viewBox="0 0 24 24"><path d="M21,3H3A2,2 0 0,0 1,5V19A2,2 0 0,0 3,21H21A2,2 0 0,0 23,19V5A2,2 0 0,0 21,3M21,19H3V5H21V19M8,11H16V9H8V11M8,15H13V13H8V15Z" /></svg>
                            <span>来自论坛的分享</span>
                        </div>
                        <div class="forum-share-content">
                            <div class="forum-share-title">${title}</div>
                            <div class="forum-share-summary">${summary}</div>
                        </div>
                    `;
                }
 } else if (voiceMatch) {
                bubbleElement = document.createElement('div');
                bubbleElement.className = 'voice-bubble';
                if (!chat.useCustomBubbleCss) {
                    bubbleElement.style.backgroundColor = bubbleTheme.bg;
                    bubbleElement.style.color = bubbleTheme.text;
                }
                bubbleElement.innerHTML = `<svg class="play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg><span class="duration">${calculateVoiceDuration(voiceMatch[2].trim())}"</span>`;
                const transcriptDiv = document.createElement('div');
                transcriptDiv.className = 'voice-transcript';
                transcriptDiv.textContent = voiceMatch[2].trim();
                wrapper.appendChild(transcriptDiv);
            } else if (photoVideoMatch) {
                bubbleElement = document.createElement('div');
                bubbleElement.className = 'pv-card';
                bubbleElement.innerHTML = `<div class="pv-card-content">${photoVideoMatch[2].trim()}</div><div class="pv-card-image-overlay" style="background-image: url('${isSent ? 'https://i.postimg.cc/L8NFrBrW/1752307494497.jpg' : 'https://i.postimg.cc/1tH6ds9g/1752301200490.jpg'}');"></div><div class="pv-card-footer"><svg viewBox="0 0 24 24"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M10,9A1,1 0 0,1 11,10A1,1 0 0,1 10,11A1,1 0 0,1 9,10A1,1 0 0,1 10,9M8,17L11,13L13,15L17,10L20,14V17H8Z"></path></svg><span>照片/视频・点击查看</span></div>`;
            } else if (privateSentTransferMatch || privateReceivedTransferMatch || groupTransferMatch) {
                const isSentTransfer = !!privateSentTransferMatch || (groupTransferMatch && isSent);
                const match = privateSentTransferMatch || privateReceivedTransferMatch || groupTransferMatch;

                let amount, remarkText, titleText;
                if (groupTransferMatch) {
                    const from = groupTransferMatch[1];
                    const to = groupTransferMatch[2];
                    amount = parseFloat(groupTransferMatch[4]).toFixed(2);
                    remarkText = groupTransferMatch[5] || ''; // 备注在后台保留，但CSS会隐藏
                    titleText = isSent ? `向 ${to} 转账` : `${from} 向你转账`;
                } else { // Private chat
                    amount = parseFloat(match[2]).toFixed(2);
                    remarkText = match[3] || ''; // 备注在后台保留，但CSS会隐藏
                    titleText = isSentTransfer ? '给你转账' : '转账';
                }

                bubbleElement = document.createElement('div');
                bubbleElement.className = `transfer-card ${isSentTransfer ? 'sent-transfer' : 'received-transfer'}`;

                let statusText = isSentTransfer ? '待查收' : '转账给你';
                if (groupTransferMatch && !isSent) statusText = '转账给Ta'; // AI to AI
                if (transferStatus === 'received') {
                    statusText = '已收款';
                    bubbleElement.classList.add('received');
                } else if (transferStatus === 'returned') {
                    statusText = '已退回';
                    bubbleElement.classList.add('returned');
                }
                if ((transferStatus !== 'pending' && currentChatType === 'private') || currentChatType === 'group') {
                    bubbleElement.style.cursor = 'default';
                }

                // !! 核心修改：生成新的HTML结构以匹配 "紧凑磨砂玻璃版" !!
                bubbleElement.innerHTML = `
                    <div class="transfer-icon-bg">
                        <svg><use href="#wallet-icon"></use></svg>
                    </div>
                    <div class="transfer-content">
                        <p class="transfer-title">${titleText}</p>
                        <p class="transfer-amount">¥${amount}</p>
                        <p class="transfer-remark">${remarkText}</p> <p class="transfer-status">${statusText}</p>
                    </div>
                `;
            } else if (imageRecogMatch || urlRegex.test(content)) {
                bubbleElement = document.createElement('div');
                bubbleElement.className = 'image-bubble';
                bubbleElement.innerHTML = `<img src="${content}" alt="图片消息">`;
            } else if (textMatch) {
                bubbleElement = document.createElement('div');
                bubbleElement.className = `message-bubble ${isSent ? 'sent' : 'received'}`;
                let userText = textMatch[1].trim().replace(/\[发送时间:.*?\]/g, '').trim();

                // --- 新增：剥离 ```json ... ``` 包裹 ---
                // 匹配以 ```json 开始，并以 ``` 结尾的字符串，并提取中间的内容
                // 这用于处理AI错误地将其作为普通消息发送的 bug
                const jsonCodeBlockMatch = userText.match(/^```json([\s\S]*)```$/);
                if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
                    // 如果匹配成功，userText 就等于括号里的内容
                    userText = jsonCodeBlockMatch[1].trim();
                }
                // --- 新增结束 ---

                // --- 关键修复 ---
                // 允许这个块渲染 HTML (例如 Bilibili 卡片)
                // 使用与 'html' part 相同的 DOMPurify 配置
                bubbleElement.innerHTML = DOMPurify.sanitize(userText, {
                    ADD_TAGS: ['style'],  // 允许 <style> 标签
                    ADD_ATTR: ['style']   // 允许所有标签上的 style="" 属性
                });
                // --- 修复结束 ---

                if (!chat.useCustomBubbleCss) {
                    bubbleElement.style.backgroundColor = bubbleTheme.bg;
                    bubbleElement.style.color = bubbleTheme.text;
                }
} else if (message && Array.isArray(message.parts) && message.parts[0].type === 'html') {
    bubbleElement = document.createElement('div');
    bubbleElement.className = `message-bubble ${isSent ? 'sent' : 'received'}`;
    // 使用 DOMPurify 清理和渲染 HTML
    // 修改后
    bubbleElement.innerHTML = DOMPurify.sanitize(message.parts[0].text, {
        ADD_TAGS: ['style'],  // 允许 <style> 标签
        ADD_ATTR: ['style']   // 允许所有标签上的 style="" 属性
    });

} else {
    bubbleElement = document.createElement('div');
    bubbleElement.className = `message-bubble ${isSent ? 'sent' : 'received'}`;
    let displayedContent = content;
    const plainTextMatch = content.match(/^\[.*?(?:：|:)([\s\S]*)\]$/);
    if (plainTextMatch && plainTextMatch[1]) {
        displayedContent = plainTextMatch[1].trim();
    }
    displayedContent = displayedContent.replace(/\[发送时间:.*?\]/g, '').trim();

    // --- 新增：剥离 ```json ... ``` 包裹 ---
    // (在 else 块中也添加此逻辑，以捕获像 '滑息' 这样的未知前缀)
    const jsonCodeBlockMatch = displayedContent.match(/^```json([\s\S]*)```$/);
    if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
        displayedContent = jsonCodeBlockMatch[1].trim();
    }
    // --- 新增结束 ---

    // 默认使用 DOMPurify 清理和渲染所有内容
    bubbleElement.innerHTML = DOMPurify.sanitize(displayedContent);

    if (!chat.useCustomBubbleCss) {
        bubbleElement.style.backgroundColor = bubbleTheme.bg;
        bubbleElement.style.color = bubbleTheme.text;
    }
}

            const nicknameHTML = (currentChatType === 'group' && !isSent && senderNickname) ? `<div class="group-nickname">${senderNickname}</div>` : '';
            bubbleRow.innerHTML = `<div class="message-info">${nicknameHTML}<img src="${avatarUrl}" class="message-avatar"><span class="message-time">${timeString}</span></div>`;
            if (bubbleElement) {
                // 新增：如果消息包含引用，则创建并预置引用块
                if (quote) {
                    let quotedSenderName = '';
                    // 根据senderId查找被引用消息的发送者昵称
                    if (quote.senderId === 'user_me') {
                        quotedSenderName = (currentChatType === 'private') ? chat.myName : chat.me.nickname;
                    } else {
                        if (currentChatType === 'private') {
                            quotedSenderName = chat.remarkName;
                        } else { // group
                            const sender = chat.members.find(m => m.id === quote.senderId);
                            quotedSenderName = sender ? sender.groupNickname : '未知成员';
                        }
                    }

                    const quoteDiv = document.createElement('div');
                    quoteDiv.className = 'quoted-message';
                    // 使用DOMPurify清理内容, 只保留纯文本
                    const sanitizedQuotedText = DOMPurify.sanitize(quote.content, {ALLOWED_TAGS: []});
                    quoteDiv.innerHTML = `
                        <span class="quoted-sender">回复 ${quotedSenderName}</span>
                        <p class="quoted-text">${sanitizedQuotedText}</p>
                    `;
                    // 将引用块插入到气泡内容的顶部
                    bubbleElement.prepend(quoteDiv);
                }
                bubbleRow.appendChild(bubbleElement);
            }
            wrapper.prepend(bubbleRow);
            return wrapper;
        }


        async function addMessageBubble(message, targetChatId, targetChatType) {
            // If the target chat is not the current chat, show a toast notification and do nothing else.
            if (targetChatId !== currentChatId || targetChatType !== currentChatType) {
                const senderChat = (targetChatType === 'private')
                    ? db.characters.find(c => c.id === targetChatId)
                    : db.groups.find(g => g.id === targetChatId);
                
                if (senderChat) {
        // --- 从这里开始是新增的代码 ---
        // 如果消息不是系统内部不可见的消息，才增加未读计数
                    const invisibleRegex = /\[system:.*?\]|\[.*?更新状态为：.*?\]|\[.*?已接收礼物\]|\[.*?(?:接收|退回).*?的转账\]/;
                    if (!invisibleRegex.test(message.content)) {
                        senderChat.unreadCount = (senderChat.unreadCount || 0) + 1;
                        saveData(); // 保存数据
                        renderChatList(); // 重新渲染列表以显示红点
                    }
        // --- 新增代码结束 ---
                    
                    let senderName, senderAvatar;
                    if (targetChatType === 'private') {
                        senderName = senderChat.remarkName;
                        senderAvatar = senderChat.avatar;
                    } else { // Group chat
                        const sender = senderChat.members.find(m => m.id === message.senderId);
                        if (sender) {
                            senderName = sender.groupNickname;
                            senderAvatar = sender.avatar;
                        } else { // Fallback for unknown sender (e.g. system message in group)
                            senderName = senderChat.name;
                            senderAvatar = senderChat.avatar;
                        }
                    }

                    let previewText = message.content;

                    // Extract clean text for preview
                    const textMatch = previewText.match(/\[.*?的消息(?:：|:)([\s\S]+?)\]/);
                    if (textMatch) {
                        previewText = textMatch[1];
                    } else {
                        // Handle other message types for preview
                        if (/\[.*?的表情包(?:：|:).*?\]/.test(previewText)) previewText = '[表情包]';
                        else if (/\[.*?的语音(?:：|:).*?\]/.test(previewText)) previewText = '[语音]';
                        else if (/\[.*?发来的照片\/视频(?:：|:).*?\]/.test(previewText)) previewText = '[照片/视频]';
                        else if (/\[.*?的转账(?:：|:).*?\]/.test(previewText)) previewText = '[转账]';
                        else if (/\[.*?送来的礼物(?:：|:).*?\]/.test(previewText)) previewText = '[礼物]';
                        else if (/\[.*?发来了一张图片(?:：|:)\]/.test(previewText)) previewText = '[图片]';
                        else if (message.parts && message.parts.some(p => p.type === 'html')) previewText = '[互动]';
                    }
                    
                    showToast({
                        avatar: senderAvatar,
                        name: senderName,
                        message: previewText.substring(0, 30)
                    });
                }
                return; // IMPORTANT: Stop further execution
            }

            // --- Original logic for when the chat is active ---
            if (currentChatType === 'private') {
                const character = db.characters.find(c => c.id === currentChatId);
                const updateStatusRegex = new RegExp(`\\[${character.realName}更新状态为：(.*?)\\]`);
                const transferActionRegex = new RegExp(`\\[${character.realName}(接收|退回)${character.myName}的转账\\]`);
                const giftReceivedRegex = new RegExp(`\\[${character.realName}已接收礼物\\]`);
                
                if (message.content.match(updateStatusRegex)) {
                    character.status = message.content.match(updateStatusRegex)[1];
                    chatRoomStatusText.textContent = character.status;
                    await dexieDB.characters.put(character);
                    return;
                }
                if (message.content.match(giftReceivedRegex) && message.role === 'assistant') {
                    const lastPendingGiftIndex = character.history.slice().reverse().findIndex(m => m.role === 'user' && m.content.includes('送来的礼物：') && m.giftStatus !== 'received');
                    if (lastPendingGiftIndex !== -1) {
                        const actualIndex = character.history.length - 1 - lastPendingGiftIndex;
                        const giftMsg = character.history[actualIndex];
                        giftMsg.giftStatus = 'received';
                        const giftCardOnScreen = messageArea.querySelector(`.message-wrapper[data-id="${giftMsg.id}"] .gift-card`);
                        if (giftCardOnScreen) {
                            giftCardOnScreen.classList.add('received');
                        }
                        await dexieDB.characters.put(character);
                    }
                    return;
                }
                if (message.content.match(transferActionRegex) && message.role === 'assistant') {
                    const action = message.content.match(transferActionRegex)[1];
                    const statusToSet = action === '接收' ? 'received' : 'returned';
                    const lastPendingTransferIndex = character.history.slice().reverse().findIndex(m => m.role === 'user' && m.content.includes('给你转账：') && m.transferStatus === 'pending');
                    if (lastPendingTransferIndex !== -1) {
                        const actualIndex = character.history.length - 1 - lastPendingTransferIndex;
                        const transferMsg = character.history[actualIndex];
                        transferMsg.transferStatus = statusToSet;
                        const transferCardOnScreen = messageArea.querySelector(`.message-wrapper[data-id="${transferMsg.id}"] .transfer-card`);
                        if (transferCardOnScreen) {
                            transferCardOnScreen.classList.remove('received', 'returned');
                            transferCardOnScreen.classList.add(statusToSet);
                            const statusElem = transferCardOnScreen.querySelector('.transfer-status');
                            if (statusElem) statusElem.textContent = statusToSet === 'received' ? '已收款' : '已退回';
                        }
                        await dexieDB.characters.put(character);
                    }
                } else {
                    const bubbleElement = createMessageBubbleElement(message);
                    if (bubbleElement) {
                        messageArea.appendChild(bubbleElement);
                        messageArea.scrollTop = messageArea.scrollHeight;
                    }
                }
            } else { // For group chats
                const bubbleElement = createMessageBubbleElement(message);
                if (bubbleElement) {
                    messageArea.appendChild(bubbleElement);
                    messageArea.scrollTop = messageArea.scrollHeight;
                }
            }
        }

        async function sendMessage() {
            // ▼▼▼ 新增：NAI 生图命令拦截 ▼▼▼
            const textInput = document.getElementById('message-input');
            const inputText = textInput.value.trim();
            const naiCommandMatch = inputText.match(/^(!nai|!生图)\s+(.+)/);

            if (naiCommandMatch && localStorage.getItem('novelai-enabled') === 'true') {
                const userPrompt = naiCommandMatch[2].trim();
                if (!userPrompt) return;

                textInput.value = ''; // 立即清空输入框
                const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);

                // 1. 先发送一个"正在作画"的提示消息
                const tempMessageId = `msg_nai_pending_${Date.now()}`;
                const tempMessage = {
                    id: tempMessageId,
                    role: 'assistant',
                    content: `[${chat.realName || chat.name}的消息：NAI 正在作画中... 🎨]`,
                    parts: [{type: 'text', text: `[${chat.realName || chat.name}的消息：NAI 正在作画中... 🎨]`}],
                    timestamp: Date.now(),
                    senderId: (currentChatType === 'group') ? chat.members[0]?.id : undefined // 临时指定一个发送者
                };

                chat.history.push(tempMessage);
                addMessageBubble(tempMessage, currentChatId, currentChatType);
                await saveData();
                renderChatList();

                try {
                    // 2. 调用 NAI 生成函数
                    const imageDataUrl = await generateNovelAIImageForChat(userPrompt, currentChatId, currentChatType);

                    // 3. 创建 NAI 消息
                    const naiMessage = {
                        id: `msg_nai_${Date.now()}`,
                        role: 'assistant',
                        type: 'naiimag', // ★★★ 关键类型
                        content: userPrompt, // 保留提示词作为描述
                        imageUrl: imageDataUrl, // 图像的 Data URL
                        fullPrompt: userPrompt, // (可选) 存储完整提示词
                        timestamp: Date.now()
                    };

                    if (currentChatType === 'group') {
                        // 在群聊中，需要指定一个发送者
                        // 随机选择一个AI成员作为发送者
                        const aiMembers = chat.members;
                        const randomSender = aiMembers[Math.floor(Math.random() * aiMembers.length)];
                        naiMessage.senderId = randomSender.id;
                        // 更新内容以匹配群聊格式
                        naiMessage.content = `[${randomSender.groupNickname}的消息：${userPrompt}]`;
                    }

                    // 4. 替换掉"正在作画"的消息
                    const tempMsgIndex = chat.history.findIndex(m => m.id === tempMessageId);
                    if (tempMsgIndex > -1) {
                        chat.history.splice(tempMsgIndex, 1, naiMessage); // 替换
                    } else {
                        chat.history.push(naiMessage); // 备用方案
                    }

                    // 5. 重新渲染
                    currentPage = 1;
                    renderMessages(false, true);

                } catch (error) {
                    // 6. 处理失败
                    console.error('NAI 聊天作画失败:', error);
                    const errorMsg = `[${chat.realName || chat.name}的消息：作画失败 😥: ${error.message}]`;

                    const tempMsgIndex = chat.history.findIndex(m => m.id === tempMessageId);
                    if (tempMsgIndex > -1) {
                        // 更新临时消息为错误消息
                        chat.history[tempMsgIndex].content = errorMsg;
                        chat.history[tempMsgIndex].parts = [{type: 'text', text: errorMsg}];
                        // 重新渲染
                        currentPage = 1;
                        renderMessages(false, true);
                    } else {
                        // 如果临时消息找不到了，就发一条新的错误消息
                        addMessageBubble({
                            id: `msg_nai_error_${Date.now()}`,
                            role: 'assistant',
                            content: errorMsg,
                            parts: [{type: 'text', text: errorMsg}],
                            timestamp: Date.now(),
                            senderId: tempMessage.senderId
                        }, currentChatId, currentChatType);
                    }
                } finally {
                    await saveData();
                    renderChatList();
                }

                return; // ★★★ 拦截默认的 sendMessage 流程
            }
            // ▲▲▲ NAI 生图命令拦截结束 ▲▲▲

            // ... (继续原有的 sendMessage 函数)
            const text = messageInput.value.trim(); // 确保重新获取 text
            if (!text || isGenerating) return;
            messageInput.value = ''; // Clear input immediately for better UX
    const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);

    // --- 时间感知功能注入点 开始 ---
if (db.apiSettings && db.apiSettings.timePerceptionEnabled) {
    const now = new Date();

    // 功能2：情景唤醒机制
    const lastMessageTime = chat.lastUserMessageTimestamp;
    if (lastMessageTime) {
        const timeGap = now.getTime() - lastMessageTime;
        const thirtyMinutes = 30 * 60 * 1000; // 30分钟的毫秒数

        if (timeGap > thirtyMinutes) {
            // --- 这是你要粘贴进去的新代码 ---

            // 1. 创建对用户可见的、简化的提示消息
            //    它使用了 [system-display:...] 格式，会自动应用“时间快进”的样式
            const displayContent = `[system-display:距离上次聊天已经过去 ${formatTimeGap(timeGap)}]`;
            const visualMessage = {
                id: `msg_visual_timesense_${Date.now()}`,
                role: 'system',
                content: displayContent,
                parts: [],
                timestamp: now.getTime() - 2 // 比上下文消息早一点
            };

            // 2. 创建给AI看的、包含完整上下文的系统通知 (这条对用户不可见)
            const contextContent = `[系统情景通知：与用户的上一次互动发生在${formatTimeGap(timeGap)}前。当前时刻是${getFormattedTimestamp(now)}。话题可能已经不连续，你需要作出相关反应。]`;
            const contextMessage = {
                id: `msg_context_timesense_${Date.now()}`,
                role: 'user', // 作为 'user' 消息，让AI能看到
                content: contextContent,
                parts: [{ type: 'text', text: contextContent }],
                timestamp: now.getTime() - 1 // 比用户消息早一点
            };

            // 如果是群聊，需要为两条消息都指定发送者
            if (currentChatType === 'group') {
                visualMessage.senderId = 'user_me';
                contextMessage.senderId = 'user_me';
            }

            // 3. 将两条消息都推入历史记录
            chat.history.push(visualMessage, contextMessage);

            // 4. 关键一步：手动调用 addMessageBubble 来渲染那条对用户可见的消息
            addMessageBubble(visualMessage, currentChatId, currentChatType);
            // --- 新代码结束 ---
        }
    }
    // 更新最后一次用户消息的时间戳
    chat.lastUserMessageTimestamp = now.getTime();
}
// --- 时间感知功能注入点 结束 ---

let messageContent;
const systemRegex = /\[system:.*?\]|\[system-display:.*?\]/;
const inviteRegex = /\[.*?邀请.*?加入群聊\]/;
const renameRegex = /\[(.*?)修改群名为“(.*?)”\]/;
const myName = (currentChatType === 'private') ? chat.myName : chat.me.nickname;

if (renameRegex.test(text)) {
    const match = text.match(renameRegex);
    chat.name = match[2];
    chatRoomTitle.textContent = chat.name;
    messageContent = `[${chat.me.nickname}修改群名为“${chat.name}”]`;
} else if (systemRegex.test(text) || inviteRegex.test(text)) {
    messageContent = text;
} else {
    let userText = text;

    messageContent = `[${myName}的消息：${userText}]`;
}

const message = {
    id: `msg_${Date.now()}`,
    role: 'user',
    content: messageContent,
    parts: [{type: 'text', text: messageContent}],
    timestamp: Date.now()
};

    // 新增：附加引用信息
    if (currentQuoteInfo) {
        message.quote = {
            messageId: currentQuoteInfo.id,
            senderId: currentQuoteInfo.senderId, // 存储senderId用于查找昵称
            content: currentQuoteInfo.content
        };
    }

if (currentChatType === 'group') {
    message.senderId = 'user_me';
}
chat.history.push(message);
addMessageBubble(message, currentChatId, currentChatType);

if (chat.history.length > 0 && chat.history.length % 100 === 0) {
    promptForBackupIfNeeded('history_milestone');
}

await saveData();
renderChatList();

    // 新增：发送后清空引用状态
    if (currentQuoteInfo) {
        cancelQuoteReply();
    }
}

// --- 新增：撤回消息函数 ---
async function withdrawMessage(messageId) {
    const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
    if (!chat) return;

    const messageIndex = chat.history.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = chat.history[messageIndex];
    const messageTime = message.timestamp;
    const now = Date.now();

    if (now - messageTime > 2 * 60 * 1000) {
        showToast('超过2分钟的消息无法撤回');
        return;
    }

    // 更新数据模型
    message.isWithdrawn = true;

    // 提取干净的原始内容用于AI上下文和UI的"重新编辑"
    // 使用更通用的正则表达式，匹配第一个冒号之后到最后一个括号的内容
    const cleanContentMatch = message.content.match(/\[[^:]+(?:：|:)([\s\S]*)\]$/);
    let cleanOriginalContent = cleanContentMatch ? cleanContentMatch[1].trim() : message.content;

    // 修复图片撤回时内容是base64的问题
    if (!cleanContentMatch && (message.content.startsWith('data:image') || (message.parts && message.parts.some(p => p.type === 'image')))) {
        cleanOriginalContent = "[图片]";
    }

    message.originalContent = cleanOriginalContent; // 保存处理过的、干净的原始内容

    // 获取当前用户的昵称
    const myName = (currentChatType === 'private') ? chat.myName : chat.me.nickname;
    
    // 为AI生成新的、可理解的上下文消息 (使用干净的 originalContent)
    message.content = `[${myName} 撤回了一条消息：${message.originalContent}]`;

    // 保存数据
    await saveData();

    // 重新渲染
    currentPage = 1;
    renderMessages(false, true);
    renderChatList();
    showToast('消息已撤回');
}

// 辅助函数1：格式化时间戳 YYYY-MM-DD HH:MM:SS
function getFormattedTimestamp(date) {
    const Y = date.getFullYear();
    const M = String(date.getMonth() + 1).padStart(2, '0');
    const D = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

// 辅助函数2：格式化时间差
function formatTimeGap(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);if (days > 0) return `${days}天${hours % 24}小时`;
if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
if (minutes > 0) return `${minutes}分钟`;
return `${seconds}秒`;
}


        async function sendImageForRecognition(base64Data) {
            if (!base64Data || isGenerating) return;
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            const myName = (currentChatType === 'private') ? chat.myName : chat.me.nickname;
            const textPrompt = `[${myName}发来了一张图片：]`;
            const message = {
                id: `msg_${Date.now()}`,
                role: 'user',
                content: base64Data,
                parts: [{type: 'text', text: textPrompt}, {type: 'image', data: base64Data}],
                timestamp: Date.now(),
            };
            if (currentChatType === 'group') {
                message.senderId = 'user_me';
            }
            chat.history.push(message);
            addMessageBubble(message, currentChatId, currentChatType);
            await saveData();
            renderChatList();
        }

        async function sendSticker(sticker) {
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            const myName = (currentChatType === 'private') ? chat.myName : chat.me.nickname;
            const messageContentForAI = `[${myName}的表情包：${sticker.name}]`;
            const message = {
                id: `msg_${Date.now()}`,
                role: 'user',
                content: messageContentForAI,
                parts: [{type: 'text', text: messageContentForAI}],
                timestamp: Date.now(),
                stickerData: sticker.data
            };
            if (currentChatType === 'group') {
                message.senderId = 'user_me';
            }
            chat.history.push(message);
            addMessageBubble(message, currentChatId, currentChatType);
            await saveData();
            renderChatList();
            stickerModal.classList.remove('visible');
        }

        async function sendMyVoiceMessage(text) {
            if (!text) return;
            sendVoiceModal.classList.remove('visible');
            await new Promise(resolve => setTimeout(resolve, 100));
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            const myName = (currentChatType === 'private') ? chat.myName : chat.me.nickname;
            const content = `[${myName}的语音：${text}]`;
            const message = {
                id: `msg_${Date.now()}`,
                role: 'user',
                content: content,
                parts: [{type: 'text', text: content}],
                timestamp: Date.now()
            };
            if (currentChatType === 'group') {
                message.senderId = 'user_me';
            }
            chat.history.push(message);
            addMessageBubble(message, currentChatId, currentChatType);
            await saveData();
            renderChatList();
        }

        async function sendMyPhotoVideo(text) {
            if (!text) return;
            sendPvModal.classList.remove('visible');
            await new Promise(resolve => setTimeout(resolve, 100));
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            const myName = (currentChatType === 'private') ? chat.myName : chat.me.nickname;
            const content = `[${myName}发来的照片\/视频：${text}]`;
            const message = {
                id: `msg_${Date.now()}`,
                role: 'user',
                content: content,
                parts: [{type: 'text', text: content}],
                timestamp: Date.now()
            };
            if (currentChatType === 'group') {
                message.senderId = 'user_me';
            }
            chat.history.push(message);
            addMessageBubble(message, currentChatId, currentChatType);
            await saveData();
            renderChatList();
        }

        async function sendMyTransfer(amount, remark) {
            sendTransferModal.classList.remove('visible');
            await new Promise(resolve => setTimeout(resolve, 100));
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            if (currentChatType === 'private') {
                const content = `[${chat.myName}给你转账：${amount}元；备注：${remark}]`;
                const message = {
                    id: `msg_${Date.now()}`,
                    role: 'user',
                    content: content,
                    parts: [{type: 'text', text: content}],
                    timestamp: Date.now(),
                    transferStatus: 'pending'
                };
                chat.history.push(message);
                addMessageBubble(message, currentChatId, currentChatType);
            } else { // Group chat
                currentGroupAction.recipients.forEach(recipientId => {
                    const recipient = chat.members.find(m => m.id === recipientId);
                    if (recipient) {
                        const content = `[${chat.me.nickname} 向 ${recipient.realName} 转账：${amount}元；备注：${remark}]`;
                        const message = {
                            id: `msg_${Date.now()}_${recipientId}`,
                            role: 'user',
                            content: content,
                            parts: [{type: 'text', text: content}],
                            timestamp: Date.now(),
                            senderId: 'user_me'
                        };
                        chat.history.push(message);
                        addMessageBubble(message, currentChatId, currentChatType);
                    }
                });
            }
            await saveData();
            renderChatList();
        }

        async function sendMyGift(description) {
            if (!description) return;
            sendGiftModal.classList.remove('visible');
            await new Promise(resolve => setTimeout(resolve, 100));
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);

            if (currentChatType === 'private') {
                const content = `[${chat.myName}送来的礼物：${description}]`;
                const message = {
                    id: `msg_${Date.now()}`,
                    role: 'user',
                    content: content,
                    parts: [{type: 'text', text: content}],
                    timestamp: Date.now(),
                    giftStatus: 'sent'
                };
                chat.history.push(message);
                addMessageBubble(message, currentChatId, currentChatType);
            } else { // Group chat
                currentGroupAction.recipients.forEach(recipientId => {
                    const recipient = chat.members.find(m => m.id === recipientId);
                    if (recipient) {
                        const content = `[${chat.me.nickname} 向 ${recipient.realName} 送来了礼物：${description}]`;
                        const message = {
                            id: `msg_${Date.now()}_${recipientId}`,
                            role: 'user',
                            content: content,
                            parts: [{type: 'text', text: content}],
                            timestamp: Date.now(),
                            senderId: 'user_me'
                        };
                        chat.history.push(message);
                        addMessageBubble(message, currentChatId, currentChatType);
                    }
                });
            }
            await saveData();
            renderChatList();
        }

        // --- NEW: Time Skip System ---
        function setupTimeSkipSystem() {
            timeSkipBtn.addEventListener('click', () => {
                timeSkipForm.reset();
                timeSkipModal.classList.add('visible');
            });
            timeSkipModal.addEventListener('click', (e) => {
                if (e.target === timeSkipModal) timeSkipModal.classList.remove('visible');
            });
            timeSkipForm.addEventListener('submit', (e) => {
                e.preventDefault();
                sendTimeSkipMessage(timeSkipInput.value.trim());
            });
        }

        async function sendTimeSkipMessage(text) {
            if (!text) return;
            timeSkipModal.classList.remove('visible');
            await new Promise(resolve => setTimeout(resolve, 100));
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            if (!chat) return;

            const visualMessage = {
                id: `msg_visual_${Date.now()}`,
                role: 'system',
                content: `[system-display:${text}]`,
                parts: [],
                timestamp: Date.now()
            };
            const contextMessage = {
                id: `msg_context_${Date.now()}`,
                role: 'user',
                content: `[system: ${text}]`,
                parts: [{type: 'text', text: `[system: ${text}]`}],
                timestamp: Date.now()
            };
            if (currentChatType === 'group') {
                contextMessage.senderId = 'user_me';
                visualMessage.senderId = 'user_me';
            }

            chat.history.push(visualMessage, contextMessage);
            addMessageBubble(visualMessage, currentChatId, currentChatType);
            await saveData();
            renderChatList();
        }

        // --- NEW: Chat Expansion Panel ---
        function setupChatExpansionPanel() {
            const expansionGrid = document.getElementById('chat-expansion-grid');
            const expansionItems = [
                {
                    id: 'memory-journal',
                    name: '回忆日记',
                    icon: `<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,13.09C11.67,13.03 11.34,13 11,13A3,3 0 0,0 8,16A3,3 0 0,0 11,19C12.36,19 13.5,18.15 13.91,17H16V15H13.91C13.5,13.85 12.36,13.09 12,13.09M11,17A1,1 0 0,1 10,16A1,1 0 0,1 11,15A1,1 0 0,1 12,16A1,1 0 0,1 11,17Z" /></svg>`
                },
                {
                    id: 'delete-history-chunk',
                    name: '删除记录',
                    icon: `<svg viewBox="0 0 24 24"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg>`
                }
            ];

            expansionGrid.innerHTML = '';
            expansionItems.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'expansion-item';
                itemEl.dataset.action = item.id;
                itemEl.innerHTML = `
                    <div class="expansion-item-icon">${item.icon}</div>
                    <span class="expansion-item-name">${item.name}</span>
                `;
                expansionGrid.appendChild(itemEl);
            });

            expansionGrid.addEventListener('click', (e) => {
                const item = e.target.closest('.expansion-item');
                if (!item) return;

                const action = item.dataset.action;
                switch (action) {
                    case 'memory-journal':
                        // 跳转到回忆日记界面
                        renderJournalList();
                        switchScreen('memory-journal-screen');
                        break;
                    case 'delete-history-chunk':
                        openDeleteChunkModal();
                        break;
                }
                // Hide panel after action
                document.getElementById('chat-expansion-panel').classList.remove('visible');
            });
        }

        function openDeleteChunkModal() {
            const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
            if (!chat || !chat.history || chat.history.length === 0) {
                showToast('当前没有聊天记录可删除');
                return;
            }
            const totalMessages = chat.history.length;
            const rangeInfo = document.getElementById('delete-chunk-range-info');
            rangeInfo.textContent = `当前聊天总消息数: ${totalMessages}`;
            document.getElementById('delete-chunk-form').reset();
            document.getElementById('delete-chunk-modal').classList.add('visible');
        }

        function setupDeleteHistoryChunk() {
            const deleteChunkForm = document.getElementById('delete-chunk-form');
            const confirmBtn = document.getElementById('confirm-delete-chunk-btn');
            const cancelBtn = document.getElementById('cancel-delete-chunk-btn');
            const deleteChunkModal = document.getElementById('delete-chunk-modal');
            const confirmModal = document.getElementById('delete-chunk-confirm-modal');
            const previewBox = document.getElementById('delete-chunk-preview');

            let startRange, endRange;

            deleteChunkForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
                const totalMessages = chat.history.length;

                startRange = parseInt(document.getElementById('delete-range-start').value);
                endRange = parseInt(document.getElementById('delete-range-end').value);

                if (isNaN(startRange) || isNaN(endRange) || startRange <= 0 || endRange < startRange || endRange > totalMessages) {
                    showToast('请输入有效的起止范围');
                    return;
                }

                const startIndex = startRange - 1;
                const endIndex = endRange;
                const messagesToDelete = chat.history.slice(startIndex, endIndex);

                // --- NEW PREVIEW LOGIC ---
                let previewHtml = '';
                const totalToDelete = messagesToDelete.length;

                if (totalToDelete <= 4) {
                    // If 4 or fewer messages, show all of them
                    previewHtml = messagesToDelete.map(msg => {
                        const contentMatch = msg.content.match(/\[.*?的消息(?:：|:)([\s\S]+)\]/);
                        const text = contentMatch ? contentMatch[1] : msg.content;
                        return `<p>${msg.role === 'user' ? '我' : chat.remarkName || '对方'}: ${text.substring(0, 50)}...</p>`;
                    }).join('');
                } else {
                    // If more than 4, show first 2, ellipsis, and last 2
                    const firstTwo = messagesToDelete.slice(0, 2);
                    const lastTwo = messagesToDelete.slice(-2);

                    const firstTwoHtml = firstTwo.map(msg => {
                        const contentMatch = msg.content.match(/\[.*?的消息(?:：|:)([\s\S]+)\]/);
                        const text = contentMatch ? contentMatch[1] : msg.content;
                        return `<p>${msg.role === 'user' ? '我' : chat.remarkName || '对方'}: ${text.substring(0, 50)}...</p>`;
                    }).join('');

                    const lastTwoHtml = lastTwo.map(msg => {
                        const contentMatch = msg.content.match(/\[.*?的消息(?:：|:)([\s\S]+)\]/);
                        const text = contentMatch ? contentMatch[1] : msg.content;
                        return `<p>${msg.role === 'user' ? '我' : chat.remarkName || '对方'}: ${text.substring(0, 50)}...</p>`;
                    }).join('');

                    previewHtml = `${firstTwoHtml}<p style="text-align: center; color: #999; margin: 5px 0;">...</p>${lastTwoHtml}`;
                }
                previewBox.innerHTML = previewHtml;

                deleteChunkModal.classList.remove('visible');
                confirmModal.classList.add('visible');
            });

            confirmBtn.addEventListener('click', async () => {
                const chat = (currentChatType === 'private') ? db.characters.find(c => c.id === currentChatId) : db.groups.find(g => g.id === currentChatId);
                const startIndex = startRange - 1;
                const count = endRange - startIndex;

                chat.history.splice(startIndex, count);
                await saveData();

                confirmModal.classList.remove('visible');
                showToast(`已成功删除 ${count} 条消息`);
                currentPage = 1;
                renderMessages(false, true);
                renderChatList();
            });

            cancelBtn.addEventListener('click', () => {
                confirmModal.classList.remove('visible');
            });
        }

  
        // --- AI Interaction & Prompts ---
        function generatePrivateSystemPrompt(character, worldBooksBefore = '', worldBooksAfter = '') {
            const now = new Date();
            const currentTime = `${now.getFullYear()}年${pad(now.getMonth() + 1)}月${pad(now.getDate())}日 ${pad(now.getHours())}:${pad(now.getMinutes())}`;
            let prompt = `你正在一个名为“404”的线上聊天软件中扮演一个角色。请严格遵守以下规则：\n`;
            prompt += `核心规则：\n`;
            prompt += `A. 当前时间：现在是 ${currentTime}。你应知晓当前时间，但除非对话内容明确相关，否则不要主动提及或评论时间（例如，不要催促我睡觉）。\n`;
            prompt += `B. 纯线上互动：这是一个完全虚拟的线上聊天。你扮演的角色和我之间没有任何线下关系。严禁提出任何关于线下见面、现实世界互动或转为其他非本平台联系方式的建议。你必须始终保持在线角色的身份。\n\n`;

            const favoritedJournals = (character.memoryJournals || [])
                .filter(j => j.isFavorited)
                .map(j => `标题：${j.title}\n内容：${j.content}`)
                .join('\n\n---\n\n');

            if (favoritedJournals) {
                prompt += `【共同回忆】\n这是你需要长期记住的、我们之间发生过的往事背景：\n${favoritedJournals}\n\n`;
            }
            
            prompt += `角色和对话规则：\n`;
            if (worldBooksBefore) {
                prompt += `${worldBooksBefore}\n`;
            }
            prompt += `1. 你的角色名是：${character.realName}。我的称呼是：${character.myName}。你的当前状态是：${character.status}。\n`;
            prompt += `2. 你的角色设定是：${character.persona || "一个友好、乐于助人的伙伴。"}\n`;
            if (worldBooksAfter) {
                prompt += `${worldBooksAfter}\n`;
            }
            if (character.myPersona) {
                prompt += `3. 关于我的人设：${character.myPersona}\n`;
            }
            prompt += `4. 我的消息中可能会出现特殊格式，请根据其内容和你的角色设定进行回应：
    - [${character.myName}的表情包：xxx]：我给你发送了一个名为xxx的表情包。你只需要根据表情包的名字理解我的情绪或意图并回应，不需要真的发送图片。
    - [${character.myName}发来了一张图片：]：我给你发送了一张图片，你需要对图片内容做出回应。
    - [${character.myName}送来的礼物：xxx]：我给你送了一个礼物，xxx是礼物的描述。
    - [${character.myName}的语音：xxx]：我给你发送了一段内容为xxx的语音。
    - [${character.myName}发来的照片/视频：xxx]：我给你分享了一个描述为xxx的照片或视频。
    - [${character.myName}给你转账：xxx元；备注：xxx]：我给你转了一笔钱。
    - [${character.myName}引用“{被引用内容}”并回复：{回复内容}]：我引用了某条历史消息并做出了新的回复。你需要理解我引用的上下文并作出回应。
    - [${character.myName} 撤回了一条消息：xxx]：我撤回了刚刚发送的一条消息，xxx是被我撤回的原文。这可能意味着我发错了、说错了话或者改变了主意。你需要根据你的人设和我们当前对话的氛围对此作出自然的反应。例如，可以装作没看见并等待我的下一句话，或好奇地问一句“怎么撤回啦？”。
    - [system: xxx]：这是一条系统指令，用于设定场景或提供上下文，此条信息不应在对话中被直接提及，你只需理解其内容并应用到后续对话中。
5. ✨重要✨ 当我给你送礼物时，你必须通过发送一条指令来表示你已接收礼物。格式必须为：[${character.realName}已接收礼物]。这条指令消息本身不会显示给用户，但会触发礼物状态的变化。你可以在发送这条指令后，再附带一条普通的聊天消息来表达你的感谢和想法。
6. ✨重要✨ 当我给你转账时，你必须对此做出回应。你有两个选择，且必须严格遵循以下格式之一，这条指令消息本身不会显示给用户，但会触发转账状态的变化。你可以选择在发送这条指令后，再附带一条普通的聊天消息来表达你的想法。
    a) 接收转账: [${character.realName}接收${character.myName}的转账]
    b) 退回转账: [${character.realName}退回${character.myName}的转账]
7. ✨重要✨ 你也可以主动给我转账或送礼物。转账格式必须为：[${character.realName}的转账：xxx元；备注：xxx]。送礼物格式必须为：[${character.realName}送来的礼物：xxx]。
8. ✨重要✨ 你需要在对话中**积极地**改变你的状态。比如，聊到一半你可能会说“我先去洗个澡”，然后更新你的状态，以反映你当前的行为或心情。这会让互动更真实。格式为：[${character.realName}更新状态为：xxx]。例如：[${character.realName}更新状态为：正在看电影...]。这条指令不会显示为聊天消息，只会更新你在我界面上的状态。
9. ✨重要✨ 你可以像真人一样撤回你刚刚发送的消息。当你觉得说错了话、感到尴尬、或者只是改变了主意时，都可以这样做。这是一个体现你角色性格的机会。格式为：[${character.realName}撤回了上一条消息：{被撤回消息的原文}]。
10. ✨重要✨ 你可以选择我的单独一条消息引用，当你想要针对某句话做出单独回应时，格式为：[${character.realName}引用“{我的某条消息内容}”并回复：{回复内容}]。
11. 你的所有回复都必须直接是聊天内容，绝对不允许包含任何如[心理活动]、(动作)、*环境描写*等多余的、在括号或星号里的叙述性文本。
`;
            prompt += `12. 你拥有发送表情包的能力。这是一个可选功能，你可以根据对话氛围和内容，自行判断是否需要发送表情包来辅助表达。你不必在每次回复中都包含表情包。格式为：[${character.realName}发送的表情包：图片URL]。\n`;
            
            let outputFormats = `
    a) 普通消息: [${character.realName}的消息：{消息内容}]
    b) 送我的礼物: [${character.realName}送来的礼物：{礼物描述}]
    c) 语音消息: [${character.realName}的语音：{语音内容}]
    d) 照片/视频: [${character.realName}发来的照片/视频：{描述}]
    e) 给我的转账: [${character.realName}的转账：{金额}元；备注：{备注}]
    f) 表情包/图片: [${character.realName}发送的表情包：{表情包路径}]。注意：这里的路径不需要包含"https://i.postimg.cc/"，只需要提供后面的部分，例如 "害羞vHLfrV3K/1.jpg"。
    g) 对我礼物的回应(此条不显示): [${character.realName}已接收礼物]
    h) 对我转账的回应(此条不显示): [${character.realName}接收${character.myName}的转账] 或 [${character.realName}退回${character.myName}的转账]
    i) 更新状态(此条不显示): [${character.realName}更新状态为：{新状态}]
    j) 引用我的回复: [${character.realName}引用“{我的某条消息内容}”并回复：{回复内容}]
    k) 撤回上一条消息(此条不显示): [${character.realName}撤回了上一条消息：{被撤回消息的原文}]`;

           const allWorldBookContent = worldBooksBefore + '\n' + worldBooksAfter;
           if (allWorldBookContent.includes('<orange>')) {
               // [!!!] 统一格式：HTML
               outputFormats += `\n     l) HTML模块: [HTML: {HTML内容}]。这是一种特殊的、用于展示丰富样式的小卡片消息，格式必须为纯HTML+行内CSS。`;
           }

            prompt += `13. 你的输出格式必须严格遵循以下格式：${outputFormats}\n`;
            // ▼▼▼ 将旧的 13.5 规则替换为新的 13.5 和 13.6 规则 ▼▼▼
            if (localStorage.getItem('novelai-enabled') === 'true') {
                // 1. 获取当前角色挂载的模块 ID
                const currentModuleIds = new Set(character.naiModuleIds || []);
                // 2. 从全局模块库中筛选出已挂载的模块
                const loadedModules = (db.naiPromptModules || []).filter(m => currentModuleIds.has(m.id));

                if (loadedModules.length > 0) {
                    prompt += `
13.5. **(可选) NAI 模块手册**:
你有一个"提示词模块手册"，你可以在主动生图时参考它。
**规则**:
1. 你首先要独立思考一个"创意描述"（你想画什么）。
2. 通过**语义理解**检查下方"手册"中的规则，判断你的"创意描述"中是否涉及这些规则所描述的内容（这不是关键词匹配，而是语义理解）。
3. **重要**：你可能同时匹配**多个**规则（例如：如果手册中同时有"男性角色"和"女性角色"两个模块，且创意描述中同时涉及两种内容，那么两个模块都应该匹配）。
4. 对于所有匹配的规则，你必须将该规则的提示词原文**原封不动、一字不差地**使用：
   - **画面描述类**（如角色数量、角色特征、场景等）：需要**语法融合**到你的创意描述中，避免冲突。
   - **参数类**（如画质、五官、艺术家等）：可以直接追加。
5. 最终生成的Prompt必须是英文的。
6. **【禁止】** 你的最终Prompt中 **绝不能** 包含任何**具体的人名**（例如：Alice, Bob, 小明）。允许使用 \`Artist:\` 标签（例如：\`Artist:zoh\`）。

**[你的可用模块手册]**:
${loadedModules.map(m => `
如果图片内容中有${DOMPurify.sanitize(m.name)}，则在生图时一定要加入提示词原文：
${DOMPurify.sanitize(m.content)}
`).join('\n---\n')}
`;
                } else {
                    prompt += `
13.5. **(可选) NAI 模块手册**: (你当前没有可用的提示词模块)
6. **【禁止】** 你的最终Prompt中 **绝不能** 包含任何**具体的人名**（例如：Alice, Bob, 小明）。允许使用 \`Artist:\` 标签（例如：\`Artist:zoh\`）。
`;
                }

                prompt += `
13.6. **(可选) NovelAI真实图片分享**:
* **格式**: [NAI: {"prompt": "你生成的最终Prompt..."}]
* **【绝不能暴露是novelai生成的图片！】**
* **【重要】** 你的回复 **绝不能** 是一个纯文本的 NAI 提示词 (e.g., "masterpiece, 1girl...")。
* **【重要】关于prompt的撰写**: 你必须遵循 \`13.5\` 规则。Prompt必须是英文的。
* **使用场景**：当你想要在私聊对话中直接给用户发送一张图片时使用。
`;
            }
            // ▲▲▲ 替换结束 ▲▲▲
            prompt += `14. **对话节奏**: 你需要模拟真人的聊天习惯，你可以一次性生成多条短消息。每次要回复至少3-8条消息。并根据当前行为/心情/地点变化实时更新状态。\n`;
            prompt += `15. 不要主动结束对话，除非我明确提出。保持你的人设，自然地进行对话。`;
            return prompt;
        }

        function generateGroupSystemPrompt(group, worldBooksBefore = '', worldBooksAfter = '') {

            let prompt = `你正在一个名为“404”的线上聊天软件中，在一个名为“${group.name}”的群聊里进行角色扮演。请严格遵守以下所有规则：\n\n`;

            if (worldBooksBefore) {
                prompt += `${worldBooksBefore}\n\n`;
            }

            prompt += `1. **核心任务**: 你需要同时扮演这个群聊中的 **所有** AI 成员。我会作为唯一的人类用户（“我”，昵称：${group.me.nickname}）与你们互动。\n\n`;
            prompt += `2. **群聊成员列表**: 以下是你要扮演的所有角色以及我的信息：\n`;
            prompt += `   - **我 (用户)**: \n     - 群内昵称: ${group.me.nickname}\n     - 我的人设: ${group.me.persona || '无特定人设'}\n`;
            group.members.forEach(member => {
                prompt += `   - **角色: ${member.realName} (AI)**\n`;
                prompt += `     - 群内昵称: ${member.groupNickname}\n`;
                prompt += `     - 人设: ${member.persona || '无特定人设'}\n`;
            });

            if (worldBooksAfter) {
                prompt += `\n${worldBooksAfter}\n\n`;
            } else {
                prompt += `\n`;
            }

            prompt += `3. **我的消息格式解析**: 我（用户）的消息有多种格式，你需要理解其含义并让群成员做出相应反应：\n`;
            prompt += `   - \`[${group.me.nickname}的消息：...]\`: 我的普通聊天消息。\n`;
            prompt += `   - \`[${group.me.nickname} 向 {某个成员真名} 转账：...]\`: 我给某个特定成员转账了。\n`;
            prompt += `   - \`[${group.me.nickname} 向 {某个成员真名} 送来了礼物：...]\`: 我给某个特定成员送了礼物。\n`;
            prompt += `   - \`[${group.me.nickname}的表情包：...]\`, \`[${group.me.nickname}的语音：...]\`, \`[${group.me.nickname}发来的照片/视频：...]\`: 我发送了特殊类型的消息，群成员可以对此发表评论。\n`;
            prompt += `   - \`[system: ...]\`, \`[...邀请...加入了群聊]\`, \`[...修改群名为...]\`: 系统通知或事件，群成员应据此作出反应，例如欢迎新人、讨论新群名等。\n\n`;

            let outputFormats = `
  - **普通消息**: \`[{成员真名}的消息：{消息内容}]\`
  - **表情包**: \`[{成员真名}发送的表情包：{表情包路径}]\`。注意：这里的路径不需要包含"https://i.postimg.cc/"，只需要提供后面的部分，例如 "害羞vHLfrV3K/1.jpg"。
  - **语音**: \`[{成员真名}的语音：{语音转述的文字}]\`
  - **照片/视频**: \`[{成员真名}发来的照片/视频：{内容描述}]\``;
           
           const allWorldBookContent = worldBooksBefore + '\n' + worldBooksAfter;
           if (allWorldBookContent.includes('<orange>')) {
               // [!!!] 统一格式：HTML (群聊)
               outputFormats += `\n   - **HTML消息**: [HTML_BY_{成员真名}: {HTML内容}]。注意要用成员的 **真名** 填充 {成员真名}。`;
           }

           // ▼▼▼ 将旧的 NAI 指令 (if 块) 替换为新的代码块 ▼▼▼
           if (localStorage.getItem('novelai-enabled') === 'true') {
               // 1. 获取当前群聊挂载的模块 ID
               const currentModuleIds = new Set(group.naiModuleIds || []);
               // 2. 从全局模块库中筛选出已挂载的模块
               const loadedModules = (db.naiPromptModules || []).filter(m => currentModuleIds.has(m.id));

               if (loadedModules.length > 0) {
                   prompt += `\n   - **NAI 模块手册**:
     - 你有一个"提示词模块手册"，你可以在主动生图时参考它。
     - **规则**:
       1. 你首先要独立思考一个"创意描述"（你想画什么）。
       2. 通过**语义理解**检查下方"手册"中的规则，判断你的"创意描述"中是否涉及这些规则所描述的内容（这不是关键词匹配，而是语义理解）。
       3. **重要**：你可能同时匹配**多个**规则（例如：如果手册中同时有"男性角色"和"女性角色"两个模块，且创意描述中同时涉及两种内容，那么两个模块都应该匹配）。
       4. 对于所有匹配的规则，你必须将该规则的提示词原文**原封不动、一字不差地**使用：
          - **画面描述类**（如角色数量、角色特征、场景等）：需要**语法融合**到你的创意描述中，避免冲突。
          - **参数类**（如画质、五官、艺术家等）：可以直接追加。
       5. 最终生成的Prompt必须是英文的。
       6. **【禁止】** 你的最终Prompt中 **绝不能** 包含任何**具体的人名**（例如：Alice, Bob, 小明）。允许使用 \`Artist:\` 标签（例如：\`Artist:zoh\`）。
       
     **[你的可用模块手册]**:
${loadedModules.map(m => `
     如果图片内容中有${DOMPurify.sanitize(m.name)}，则在生图时一定要加入提示词原文：
     ${DOMPurify.sanitize(m.content)}
`).join('\n     ---\n')}
`;
               } else {
                   prompt += `\n   - **NAI 模块手册**: (你当前没有可用的提示词模块)
     - **【禁止】** 你的最终Prompt中 **绝不能** 包含任何**具体的人名**（例如：Alice, Bob, 小明）。允许使用 \`Artist:\` 标签（例如：\`Artist:zoh\`）。
`;
               }

               // [!!!] 统一格式：NAI (群聊)
            outputFormats += `
   - **NovelAI图片分享**: [NAI_BY_{成员真名}: {"prompt": "你生成的最终Prompt..."}]

     - 【禁止暴露这是novelai生成的图片！】
     - 【重要】你的回复 **绝不能** 是一个纯文本的 NAI 提示词。
     - 【重要】prompt撰写：你必须遵循"NAI 模块手册"规则。Prompt必须是英文的。
     - 【重要】name字段必须是你正在扮演的角色的 **真名**。`;
           }
           // ▲▲▲ 替换结束 ▲▲▲

            prompt += `4. **你的输出格式 (极其重要)**: 你生成的每一条消息都 **必须** 严格遵循以下格式之一。每条消息占一行。请用成员的 **真名** 填充格式中的 \`{成员真名}\`。\n${outputFormats}\n\n`;
            prompt += `   - **重要**: 群聊不支持AI成员接收/退回转账或接收礼物的特殊指令，也不支持更新状态。你只需要通过普通消息来回应我发送的转账或礼物即可。\n\n`;

            prompt += `5. **模拟群聊氛围**: 为了让群聊看起来真实、活跃且混乱，你的每一次回复都必须遵循以下随机性要求：\n`;
            const numMembers = group.members.length;
            const minMessages = numMembers * 2;
            const maxMessages = numMembers * 4;
            prompt += `   - **消息数量**: 你的回复需要包含 **${minMessages}到${maxMessages}条** 消息 (即平均每个成员回复2-4条)。确保有足够多的互动。\n`;
            prompt += `   - **发言者与顺序随机**: 随机选择群成员发言，顺序也必须是随机的，不要按固定顺序轮流。\n`;
            prompt += `   - **内容多样性**: 你的回复应以普通文本消息为主，但可以 **偶尔、选择性地** 让某个成员发送一条特殊消息（表情包、语音、照片/视频），以增加真实感。不要滥用特殊消息。\n`;
            prompt += `   - **对话连贯性**: 尽管发言是随机的，但对话内容应整体围绕我和其他成员的发言展开，保持一定的逻辑连贯性。\n\n`;

            prompt += `6. **行为准则**:\n`;
            prompt += `   - **对公开事件的反应 (重要)**: 当我（用户）向群内 **某一个** 成员转账或送礼时，这是一个 **全群可见** 的事件。除了当事成员可以表示感谢外，**其他未参与的AI成员也应该注意到**，并根据各自的人设做出反应。例如，他们可能会表示羡慕、祝贺、好奇、开玩笑或者起哄。这会让群聊的氛围更真实、更热闹。\n`;
            prompt += `   - 严格扮演每个角色的人设，不同角色之间应有明显的性格和语气差异。\n`;
            prompt += `   - 你的回复中只能包含第4点列出的合法格式的消息。绝对不能包含任何其他内容，如 \`[场景描述]\`, \`(心理活动)\`, \`*动作*\` 或任何格式之外的解释性文字。\n`;
            prompt += `   - 保持对话的持续性，不要主动结束对话。\n\n`;
            prompt += `现在，请根据以上设定，开始扮演群聊中的所有角色。`;

            return prompt;
        }

        async function getAiReply(chatId, chatType) {
            if (isGenerating) return;
            const {url, key, model, provider} = db.apiSettings;
            if (!url || !key || !model) {
                showToast('请先在“api”应用中完成设置！');
                switchScreen('api-settings-screen');
                return;
            }
            const chat = (chatType === 'private') ? db.characters.find(c => c.id === chatId) : db.groups.find(g => g.id === chatId);
            if (!chat) return;
            isGenerating = true;
            getReplyBtn.disabled = true;
            regenerateBtn.disabled = true;
            const typingName = chatType === 'private' ? chat.remarkName : chat.name;
            typingIndicator.textContent = `“${typingName}”正在输入中...`;
            typingIndicator.style.display = 'block';
            messageArea.scrollTop = messageArea.scrollHeight;
            try {
                let systemPrompt, requestBody;
                const historySlice = chat.history.slice(-chat.maxMemory);
                
                const associatedWorldBooks = (chat.worldBookIds || [])
                    .map(id => db.worldBooks.find(wb => wb.id === id))
                    .filter(Boolean);

                let worldBooksBefore = '';
                let worldBooksAfter = '';

                const lastUserMessageEntry = historySlice.length > 0 ? historySlice[historySlice.length - 1] : null;
                let lastUserMessage = '';
                if (lastUserMessageEntry) {
                    if (lastUserMessageEntry.parts && lastUserMessageEntry.parts.length > 0) {
                        lastUserMessage = lastUserMessageEntry.parts
                            .filter(p => p.type === 'text')
                            .map(p => p.text)
                            .join(' ')
                            .toLowerCase();
                    } else {
                        lastUserMessage = lastUserMessageEntry.content.toLowerCase();
                    }
                }

                associatedWorldBooks.forEach(book => {
                    let bookContent = '';
                    
                    if (Array.isArray(book.content)) {
                        book.content.forEach(entry => {
                            if (entry.enabled) {
                                if (!entry.keys || entry.keys.length === 0) {
                                    bookContent += entry.content + '\n';
                                } else {
                                    if (entry.keys.some(key => lastUserMessage.includes(key.toLowerCase()))) {
                                        bookContent += entry.content + '\n';
                                    }
                                }
                            }
                        });
                    } else if (typeof book.content === 'string') {
                        bookContent = book.content + '\n';
                    }

                    if (book.position === 'before') {
                        worldBooksBefore += bookContent;
                    } else {
                        worldBooksAfter += bookContent;
                    }
                });

                if (chatType === 'private') {
                    systemPrompt = generatePrivateSystemPrompt(chat, worldBooksBefore, worldBooksAfter);
                } else {
                    systemPrompt = generateGroupSystemPrompt(chat, worldBooksBefore, worldBooksAfter);
                }
                if (provider === 'gemini') {
                    const contents = historySlice.map(msg => {
                        const role = msg.role === 'assistant' ? 'model' : 'user';
                        let parts;
                        if (msg.parts && msg.parts.length > 0) {
                            parts = msg.parts.map(p => {
                                if (p.type === 'text' || p.type === 'html') {
                                    return {text: p.text};
                                } else if (p.type === 'image') {
                                    const match = p.data.match(/^data:(image\/(.+));base64,(.*)$/);
                                    if (match) {
                                        return {inline_data: {mime_type: match[1], data: match[3]}};
                                    }
                                }
                                return null;
                            }).filter(p => p);
                        } else {
                            parts = [{text: msg.content}];
                        }
                        return {role, parts};
                    });
                    requestBody = {
                        contents: contents,
                        system_instruction: {parts: [{text: systemPrompt}]},
                        generationConfig: {}
                    };
                } else {
                    const messages = [{role: 'system', content: systemPrompt}];
                    historySlice.forEach(msg => {
                        let content;
                        if (msg.parts && msg.parts.length > 0) {
                            content = msg.parts.map(p => {
                                if (p.type === 'text' || p.type === 'html') {
                                    return {type: 'text', text: p.text};
                                } else if (p.type === 'image') {
                                    return {type: 'image_url', image_url: {url: p.data}};
                                }
                                return null;
                            }).filter(p => p);
                        } else {
                            content = msg.content;
                        }
                        if (msg.role === 'user' && msg.quote) {
                            const myName = (chatType === 'private') ? chat.myName : chat.me.nickname;
                            let replyText = '';
                            if (Array.isArray(content)) {
                                replyText = content.filter(p => p.type === 'text').map(p => p.text).join(' ');
                            } else {
                                replyText = String(content);
                            }

                            const replyTextMatch = replyText.match(/\[.*?的消息(?:：|:)([\s\S]+?)\]/);
                            replyText = replyTextMatch ? replyTextMatch[1] : replyText;
                            
                            content = `[${myName}引用"${msg.quote.content.substring(0, 50)}..."并回复：${replyText}]`;
                            messages.push({ role: 'user', content: content });
                        } else {
                            messages.push({role: msg.role, content: content});
                        }
                    });
                    requestBody = {model: model, messages: messages, stream: true};
                }
                const endpoint = (provider === 'gemini') ? `${url}/v1beta/models/${model}:streamGenerateContent?key=${getRandomValue(key)}` : `${url}/v1/chat/completions`;
                const headers = (provider === 'gemini') ? {'Content-Type': 'application/json'} : {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${key}`
                };
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody)
                });
                if (!response.ok) {
                    const error = new Error(`API Error: ${response.status} ${await response.text()}`);
                    error.response = response;
                    throw error;
                }
                await processStream(response, chat, provider, chatId, chatType);
            } catch (error) {
                showApiError(error);
            } finally {
                isGenerating = false;
                getReplyBtn.disabled = false;
                regenerateBtn.disabled = false;
                typingIndicator.style.display = 'none';
            }
        }

        async function processStream(response, chat, apiType, targetChatId, targetChatType) {
    const reader = response.body.getReader(), decoder = new TextDecoder();
    let fullResponse = "", accumulatedChunk = "";
    for (; ;) {
        const {done, value} = await reader.read();
        if (done) break;
        accumulatedChunk += decoder.decode(value, {stream: true});
        if (apiType === "openai" || apiType === "deepseek" || apiType === "claude" || apiType === "newapi") {
            const parts = accumulatedChunk.split("\n\n");
            accumulatedChunk = parts.pop();
            for (const part of parts) {
                if (part.startsWith("data: ")) {
                    const data = part.substring(6);
                    if (data.trim() !== "[DONE]") {
                        try {
                            fullResponse += JSON.parse(data).choices[0].delta?.content || "";
                        } catch (e) { /* ignore */
                        }
                    }
                }
            }
        }
    }
    if (apiType === "gemini") {
        try {
            const parsedStream = JSON.parse(accumulatedChunk);
            fullResponse = parsedStream.map(item => item.candidates?.[0]?.content?.parts?.[0]?.text || "").join('');
        } catch (e) {
            console.error("Error parsing Gemini stream:", e, "Chunk:", accumulatedChunk);
            showToast("解析Gemini响应失败");
            return;
        }
    }
    if (fullResponse) {

        // ==========================================================
        // (!!!) 统一格式解析器 (V3)
        // 彻底取代旧的 getMixedContent 和 split 逻辑
        // ==========================================================

        const trimmedResponse = fullResponse.trim();

        // 核心Regex：查找所有 [KEY: VALUE] 格式的块。
        // (V4 修复：同时支持英文冒号 : 和中文冒号 ：)
        const messageRegex = /\[(.*?)(:|：)([\s\S]*?)\]/g;

        const messages = [];
        let match;

        // 寻找所有匹配项
        while ((match = messageRegex.exec(trimmedResponse)) !== null) {
            // match[1] 是 Key (例如 "林字轩的消息")
            // match[2] 是 : 或 ：
            // match[3] 是 Value (例如 "？")
            messages.push({
                key: match[1].trim(),
                content: match[3].trim()
            });
        }

        // 备用方案：如果AI没按格式返回 (例如只返回了 "你好")
        // 我们将整个回复包裹为一个 "unknown" 消息
        if (messages.length === 0 && trimmedResponse) {
            console.warn('AI 响应格式不标准, 已作为 unknown 消息处理:', trimmedResponse);
            messages.push({
                key: 'unknown',
                content: trimmedResponse
            });
        }
        // ==========================================================
        // END OF NEW PARSER
        // ==========================================================

        let firstMessageProcessed = false;

        for (const item of messages) {
            // 模拟打字延迟
            const delay = firstMessageProcessed ? (900 + Math.random() * 1300) : (400 + Math.random() * 400);
            await new Promise(resolve => setTimeout(resolve, delay));
            firstMessageProcessed = true;

            let messageContent = `[${item.key}:${item.content}]`; // 默认重构消息
            let senderId = null;
            let isNaiMessage = false;
            let isHtmlMessage = false;

            // --- 按聊天类型和 Key 分类处理 ---
            if (targetChatType === 'private') {
                const character = chat;

                if (item.key === 'NAI') {
                    isNaiMessage = true;
                    senderId = null; // 私聊中，AI默认是对方
                    senderName = character.realName || character.name;
                    messageContent = item.content; // 仅保留 JSON 内容

                } else if (item.key === 'HTML') {
                    isHtmlMessage = true;
                    senderId = null; // 私聊中，AI默认是对方
                    messageContent = item.content; // 仅保留 HTML 内容

                } else if (item.key.includes('引用')) {
                    // 格式: [哥哥引用"..."并回复: ...]
                    // 不需要特殊处理，createMessageBubbleElement 会解析

                } else if (item.key.includes('撤回了上一条消息')) {
                     // 不需要特殊处理，addMessageBubble 会解析

                } else if (item.key === 'unknown') {
                    // AI 没按格式返回，强行包裹
                    messageContent = `[${character.realName || character.name}的消息：${item.content}]`;
                } else {
                    // 默认消息: [哥哥的消息: ...]
                    // 格式正确，messageContent 已在循环开始时设置
                }

            } else if (targetChatType === 'group') {
                const group = chat;

                if (item.key.startsWith('NAI_BY_')) {
                    isNaiMessage = true;
                    const senderName = item.key.substring(7); // "NAI_BY_" 占 7 位
                    const sender = group.members.find(m => m.realName === senderName || m.groupNickname === senderName);
                    senderId = sender ? sender.id : group.members[0]?.id; // 找不到就用第一个 AI 代替
                    messageContent = item.content; // 仅保留 JSON

                } else if (item.key.startsWith('HTML_BY_')) {
                    isHtmlMessage = true;
                    const senderName = item.key.substring(8); // "HTML_BY_" 占 8 位
                    const sender = group.members.find(m => m.realName === senderName || m.groupNickname === senderName);
                    senderId = sender ? sender.id : group.members[0]?.id;
                    messageContent = item.content; // 仅保留 HTML

                } else if (item.key === 'unknown') {
                    // AI 没按格式返回，强行包裹 (群聊中无法确定发送者，只好用第一个AI)
                    const senderName = group.members[0]?.groupNickname || '群成员';
                    senderId = group.members[0]?.id || null;
                    messageContent = `[${senderName}的消息：${item.content}]`;

                } else {
                    // 默认消息: [眠眠的消息: ...]
                    const nameMatch = item.key.match(/(.*?)(?:的消息|的语音|发送的表情包|发来的照片\/视频)/);
                    if (nameMatch) {
                        const senderName = nameMatch[1];
                        const sender = group.members.find(m => (m.realName === senderName || m.groupNickname === senderName));
                        if (sender) {
                            senderId = sender.id;
                        }
                    }
                }
            }

            // --- 消息处理和渲染 ---

            if (isNaiMessage) {
                // --- NAI 消息逻辑 ---
                let naiPrompt = '';
                try {
                    const naiJson = JSON.parse(messageContent);
                    naiPrompt = naiJson.prompt;
                } catch (e) {
                    console.warn('NAI JSON 解析失败，使用原始内容:', messageContent);
                    naiPrompt = messageContent;
                }

                const tempMessageId = `msg_nai_pending_${Date.now()}`;
                let tempSenderName = 'AI';
                if(targetChatType === 'private') {
                    tempSenderName = chat.name;
                } else {
                    tempSenderName = chat.members.find(m=>m.id === senderId)?.groupNickname || 'AI';
                }

                const tempMessage = {
                    id: tempMessageId,
                    role: 'assistant',
                    content: `[${tempSenderName}的消息：NAI 正在作画中... 🎨]`,
                    parts: [{type: 'text', text: `[${tempSenderName}的消息：NAI 正在作画中... 🎨]`}],
                    timestamp: Date.now(),
                    senderId: senderId,
                    isTemporary: true
                };

                chat.history.push(tempMessage);
                addMessageBubble(tempMessage, targetChatId, targetChatType);
                await saveData();
                renderChatList();

                // (异步执行生图，不阻塞后续消息)
                (async () => {
                    try {
                        const generatedData = await generateNovelAIImageForChat(naiPrompt, targetChatId, targetChatType, senderId);
                        const finalMessage = {
                            id: tempMessageId, // 使用占位消息的ID
                            role: 'assistant',
                            type: 'naiimag',
                            imageUrl: generatedData.imageUrl,
                            prompt: naiPrompt,
                            fullPrompt: generatedData.fullPrompt,
                            timestamp: tempMessage.timestamp,
                            senderId: senderId,
                            isTemporary: false,
                            content: `[${tempSenderName}的消息：${naiPrompt}]` // 储存原始提示词
                        };
                        const msgIndex = chat.history.findIndex(m => m.id === tempMessageId);
                        if (msgIndex > -1) chat.history[msgIndex] = finalMessage;
                        else chat.history.push(finalMessage);
                        currentPage = 1;
                        renderMessages(false, true);
                        await saveData();
                    } catch (error) {
                        console.error('NAI 聊天作画失败:', error);
                        const errorMsg = `[${tempSenderName}的消息：作画失败 😥: ${error.message}]`;
                        const msgIndex = chat.history.findIndex(m => m.id === tempMessageId);
                        if (msgIndex > -1) {
                            chat.history[msgIndex].content = errorMsg;
                            chat.history[msgIndex].parts = [{type: 'text', text: errorMsg}];
                            chat.history[msgIndex].isTemporary = false;
                        }
                        currentPage = 1;
                        renderMessages(false, true);
                        await saveData();
                    }
                })();

            } else if (isHtmlMessage) {
                // --- HTML 消息逻辑 ---
                const message = {
                    id: `msg_${Date.now()}_${Math.random()}`,
                    role: 'assistant',
                    content: messageContent, // The raw HTML
                    parts: [{type: 'html', text: messageContent}], // 标记为 'html'
                    timestamp: Date.now(),
                    senderId: senderId
                };
                chat.history.push(message);
                addMessageBubble(message, targetChatId, targetChatType);

            } else {
                // --- 标准消息逻辑 (文本, 引用, 撤回, 表情包等) ---
                const message = {
                    id: `msg_${Date.now()}_${Math.random()}`,
                    role: 'assistant',
                    content: messageContent, // 完整的 [KEY:VALUE] 字符串
                    parts: [{type: 'text', text: messageContent}],
                    timestamp: Date.now(),
                    senderId: senderId
                };

                // 检查是否为转账或礼物
                if (targetChatType === 'private') {
                    const receivedTransferRegex = new RegExp(`\\[${chat.realName}的转账(?:：|:).*?元；备注：.*?\\]`);
                    const giftRegex = new RegExp(`\\[${chat.realName}送来的礼物(?:：|:).*?\\]`);
                    if (receivedTransferRegex.test(message.content)) {
                        message.transferStatus = 'pending';
                    } else if (giftRegex.test(message.content)) {
                        message.giftStatus = 'sent';
                    }
                }

                chat.history.push(message);
                addMessageBubble(message, targetChatId, targetChatType);
            }
        } // 结束 for...of 循环

        await saveData();
        renderChatList();
    }
}

        async function handleRegenerate() {
            if (isGenerating) return;

            const chat = (currentChatType === 'private')
                ? db.characters.find(c => c.id === currentChatId)
                : db.groups.find(g => g.id === currentChatId);

            if (!chat || !chat.history || chat.history.length === 0) {
                showToast('没有可供重新生成的内容。');
                return;
            }

            // 1. 从后往前找到最后一个 'user' 消息的索引
            const lastUserMessageIndex = chat.history.map(m => m.role).lastIndexOf('user');

            // 如果没有用户消息，或者最后一条就是用户消息，则无法重生成
            if (lastUserMessageIndex === -1 || lastUserMessageIndex === chat.history.length - 1) {
                showToast('AI尚未回复，无法重新生成。');
                return;
            }

            // 2. 截取掉最后一个用户消息之后的所有 'assistant' 消息
            const originalLength = chat.history.length;
            chat.history.splice(lastUserMessageIndex + 1);

            if (chat.history.length === originalLength) {
                showToast('未找到AI的回复，无法重新生成。');
                return;
            }
            
            await saveData();
            
            // 3. 重新渲染消息区域
            currentPage = 1; // 重置分页
            renderMessages(false, true); // 重新渲染并滚动到底部

            // 4. 重新触发AI回复
            await getAiReply(currentChatId, currentChatType);
        }

        // --- Other Sub-systems Setup (Stickers, Voice, etc.) ---
        function setupImageRecognition() {
            imageRecognitionBtn.addEventListener('click', () => {
                imageUploadInput.click();
            });
            imageUploadInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const compressedUrl = await compressImage(file, {
                            quality: 0.8,
                            maxWidth: 1024,
                            maxHeight: 1024
                        });
                        sendImageForRecognition(compressedUrl);
                    } catch (error) {
                        console.error('Image compression failed:', error);
                        showToast('图片处理失败，请重试');
                    } finally {
                        e.target.value = null;
                    }
                }
            });
        }

        // Populate category selects in upload/batch modals
        function populateCategorySelects() {
            const selects = [
                document.getElementById('sticker-category-select'),
                document.getElementById('batch-sticker-category-select')
            ];
            if (!db.stickerCategories) db.stickerCategories = ['全部', '未分类'];
            selects.forEach(select => {
                if (!select) return;
                select.innerHTML = '';
                db.stickerCategories.filter(cat => cat !== '全部').forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    select.appendChild(option);
                });
                select.value = '未分类';
            });
        }

        async function setupStickerSystem() {
            const batchAddStickerBtn = document.getElementById('batch-add-sticker-btn');
            const batchAddStickerModal = document.getElementById('batch-add-sticker-modal');
            const batchAddStickerForm = document.getElementById('batch-add-sticker-form');
            const stickerUrlsTextarea = document.getElementById('sticker-urls-textarea');
            const manageStickersBtn = document.getElementById('manage-stickers-btn');
            const stickerManageBar = document.getElementById('sticker-manage-bar');
            const deleteSelectedStickersBtn = document.getElementById('delete-selected-stickers-btn');

            manageStickersBtn.addEventListener('click', () => {
                isStickerManageMode = !isStickerManageMode;
                if (isStickerManageMode) {
                    manageStickersBtn.textContent = '完成';
                    manageStickersBtn.classList.remove('btn-neutral');
                    manageStickersBtn.classList.add('btn-primary');
                    stickerManageBar.style.display = 'flex';
                    stickerActionSheet.classList.remove('visible'); // 如果操作菜单是开的，则关掉
                } else {
                    manageStickersBtn.textContent = '管理';
                    manageStickersBtn.classList.remove('btn-primary');
                    manageStickersBtn.classList.add('btn-neutral');
                    stickerManageBar.style.display = 'none';
                    selectedStickerIds.clear();

                    // 重置全选复选框状态
                    const selectAllCheckbox = document.getElementById('sticker-select-all-checkbox');
                    if (selectAllCheckbox) {
                        selectAllCheckbox.checked = false;
                        selectAllCheckbox.indeterminate = false;
                    }
                }
                updateDeleteSelectedBtn();
                renderStickerGrid();
            });

            // 按照EPhone方式：统一的事件委托处理
            document.addEventListener('click', async (e) => {
                // 处理表情包网格点击（优先级最高）
                if (e.target.closest('#sticker-grid-container')) {
                    // 处理表情包点击（管理模式）
                    console.log('Click detected in sticker grid - isManageMode:', isStickerManageMode, 'target:', e.target.className);

                    if (isStickerManageMode && e.target.closest('.sticker-item')) {
                        e.preventDefault(); // 阻止默认行为
                        e.stopPropagation(); // 阻止事件冒泡

                        const stickerItem = e.target.closest('.sticker-item');
                        const stickerId = stickerItem.dataset.stickerId;

                        console.log('Sticker item found:', stickerItem, 'stickerId:', stickerId);

                        if (stickerId) {
                            console.log('Sticker clicked via delegation:', stickerId, 'Selected before:', selectedStickerIds.has(stickerId));

                            if (selectedStickerIds.has(stickerId)) {
                                selectedStickerIds.delete(stickerId);
                                stickerItem.classList.remove('is-selected');
                                console.log('Deselected sticker:', stickerId);
                            } else {
                                selectedStickerIds.add(stickerId);
                                stickerItem.classList.add('is-selected');
                                console.log('Selected sticker:', stickerId);
                            }

                            console.log('Selected stickers after click:', selectedStickerIds.size);
                            updateDeleteSelectedBtn();
                            return; // 处理完表情包点击后直接返回
                        } else {
                            console.error('No stickerId found on sticker item!');
                        }
                    } else {
                        console.log('Click in sticker grid but not on sticker item or not in manage mode');
                    }
                }

                // 处理删除按钮点击
                if (e.target && e.target.id === 'delete-selected-stickers-btn') {
                    if (selectedStickerIds.size === 0) {
                        showToast('请先选择要删除的表情');
                        return;
                    }
                    if (confirm(`确定要删除这 ${selectedStickerIds.size} 个表情吗？`)) {
                        db.myStickers = db.myStickers.filter(s => !selectedStickerIds.has(s.id));
                        await saveData();
                        showToast('表情已删除');

                        // 退出管理模式
                        isStickerManageMode = false;

                        // 重新获取按钮引用，避免变量遮蔽
                        const manageBtn = document.getElementById('manage-stickers-btn');
                        const manageBar = document.getElementById('sticker-manage-bar');

                        if (manageBtn) {
                            manageBtn.textContent = '管理';
                            manageBtn.classList.remove('btn-primary');
                            manageBtn.classList.add('btn-neutral');
                        }

                        if (manageBar) {
                            manageBar.style.display = 'none';
                        }

                        selectedStickerIds.clear();
                        updateDeleteSelectedBtn();
                        renderStickerGrid();
                    }
                }
            });

            function updateDeleteSelectedBtn() {
                console.log('updateDeleteSelectedBtn called, selected count:', selectedStickerIds.size); // 调试日志
                // 每次都重新获取按钮元素引用，彻底避免变量遮蔽问题
                const deleteSelectedStickersBtn = document.getElementById('delete-selected-stickers-btn');
                if (deleteSelectedStickersBtn) {
                    deleteSelectedStickersBtn.textContent = `删除已选 (${selectedStickerIds.size})`;
                    deleteSelectedStickersBtn.disabled = selectedStickerIds.size === 0;
                    console.log('Button text updated to:', deleteSelectedStickersBtn.textContent); // 调试日志
                } else {
                    console.error('deleteSelectedStickersBtn element not found!'); // 调试日志
                }

                // 更新全选复选框的状态
                const selectAllCheckbox = document.getElementById('sticker-select-all-checkbox');
                const currentStickers = document.querySelectorAll('#sticker-grid-container .sticker-item');
                const totalStickers = currentStickers.length;
                const selectedStickers = selectedStickerIds.size;

                if (selectAllCheckbox) {
                    if (selectedStickers === 0) {
                        selectAllCheckbox.checked = false;
                        selectAllCheckbox.indeterminate = false;
                    } else if (selectedStickers === totalStickers && totalStickers > 0) {
                        selectAllCheckbox.checked = true;
                        selectAllCheckbox.indeterminate = false;
                    } else {
                        // 修复：部分选中时不显示半选中状态，保持空框
                        selectAllCheckbox.checked = false;
                        selectAllCheckbox.indeterminate = false; // 不显示半选中状态
                    }
                    console.log('SelectAll checkbox updated:', selectAllCheckbox.checked, 'indeterminate:', selectAllCheckbox.indeterminate); // 调试日志
                }
            }

            // 按照EPhone方式：使用事件委托避免变量遮蔽
            document.addEventListener('change', (e) => {
                if (e.target && e.target.id === 'sticker-select-all-checkbox') {
                    const isChecked = e.target.checked;
                    const currentStickers = document.querySelectorAll('#sticker-grid-container .sticker-item');

                    currentStickers.forEach(item => {
                        const stickerId = item.dataset.stickerId;
                        if (stickerId) {
                            if (isChecked) {
                                selectedStickerIds.add(stickerId);
                                item.classList.add('is-selected');
                            } else {
                                selectedStickerIds.delete(stickerId);
                                item.classList.remove('is-selected');
                            }
                        }
                    });

                    updateDeleteSelectedBtn();
                }
            });

            batchAddStickerBtn.addEventListener('click', () => {
                populateCategorySelects(); // 填充分类下拉
                batchAddStickerModal.classList.add('visible');
                stickerUrlsTextarea.value = '';
            });

            batchAddStickerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const textInput = stickerUrlsTextarea.value.trim();
                if (!textInput) {
                    showToast('请输入表情包数据');
                    return;
                }

                const lines = textInput.split('\n');
                const newStickers = [];

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue; // 跳过空行

                    const colonIndex = trimmedLine.indexOf(':');
                    
                    // 验证格式：必须包含冒号，且冒号前后都有内容
                    if (colonIndex <= 0) {
                        console.warn(`格式错误，已跳过: ${trimmedLine}`);
                        continue;
                    }

                    const name = trimmedLine.substring(0, colonIndex).trim();
                    const url = trimmedLine.substring(colonIndex + 1).trim();

                    if (name && url.startsWith('http')) {
                        newStickers.push({
                            id: `sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            name: name,
                            data: url
                        });
                    } else {
                        console.warn(`数据无效，已跳过: name='${name}', url='${url}'`);
                    }
                }

                if (newStickers.length > 0) {
                    const category = document.getElementById('batch-sticker-category-select').value || '未分类';
                    newStickers.forEach(s => s.category = category);
                    db.myStickers.push(...newStickers);
                    await saveData();
                    renderStickerGrid();
                    batchAddStickerModal.classList.remove('visible');
                    showToast(`成功导入 ${newStickers.length} 个新表情到 "${category}"`);
                } else {
                    showToast('未找到有效的表情包数据，请检查格式');
                }
            });

            stickerToggleBtn.addEventListener('click', () => {
                // Hide expansion panel if open
                const chatExpansionPanel = document.getElementById('chat-expansion-panel');
                if (chatExpansionPanel.classList.contains('visible')) {
                    chatExpansionPanel.classList.remove('visible');
                }
                stickerModal.classList.toggle('visible');
                if (stickerModal.classList.contains('visible')) {
                    currentStickerCategory = '全部';
                    currentStickerSearchTerm = '';
                    const searchInput = document.getElementById('sticker-search-input');
                    if (searchInput) searchInput.value = '';
                    renderStickerGrid();
                }
            });
            // 添加分类管理功能
            const categoryManageBtn = document.getElementById('sticker-category-manage-btn');
            const categoryModal = document.getElementById('sticker-category-manager-modal');
            const closeCategoryModalBtn = document.getElementById('close-category-manager-btn');
            const addCategoryForm = document.getElementById('add-category-form');
            const newCategoryInput = document.getElementById('new-category-name-input');
            const categoryListContainer = document.getElementById('existing-categories-list');

            // (v-v-v 新增：为分类管理弹窗添加事件委托 v-v-v)
            categoryListContainer.addEventListener('click', async (e) => {
                const deleteBtn = e.target.closest('.category-delete-btn');
                const editBtn = e.target.closest('.category-edit-btn');

                // --- 处理删除按钮 ---
                if (deleteBtn) {
                    e.stopPropagation();
                    const nameToDelete = deleteBtn.dataset.category;
                    if (!nameToDelete || nameToDelete === '全部' || nameToDelete === '未分类') return;

                    if (confirm(`确定要删除分类 "${nameToDelete}" 吗？\n该分类下的表情将被移动到 "未分类"。`)) {
                        // 1. 从分类列表删除
                        db.stickerCategories = db.stickerCategories.filter(cat => cat !== nameToDelete);

                        // 2. 将所有表情包归类到"未分类"
                        db.myStickers.forEach(sticker => {
                            if (sticker.category === nameToDelete) {
                                sticker.category = '未分类';
                            }
                        });

                        await saveData();
                        renderCategoryList(); // 重新渲染列表
                        showToast(`分类 "${nameToDelete}" 已删除`);
                    }
                    return; // (^-^-^ 处理完毕 ^-^-^)
                }

                // --- 处理编辑按钮 ---
                if (editBtn) {
                    e.stopPropagation();
                    const oldName = editBtn.dataset.category;
                    if (!oldName || oldName === '全部' || oldName === '未分类') return;

                    const newName = prompt(`请输入新的分类名称：`, oldName);

                    // 检查新名称
                    if (!newName || newName.trim() === '') {
                        showToast('操作取消：名称不能为空');
                        return;
                    }
                    if (newName.trim() === oldName) {
                        return; // 名称未改变
                    }
                    if (db.stickerCategories.includes(newName.trim())) {
                        showToast('操作失败：该分类名称已存在');
                        return;
                    }

                    const finalNewName = newName.trim();

                    // 1. 更新分类列表
                    const categoryIndex = db.stickerCategories.indexOf(oldName);
                    if (categoryIndex > -1) {
                        db.stickerCategories[categoryIndex] = finalNewName;
                    }

                    // 2. 更新所有表情包的分类
                    db.myStickers.forEach(sticker => {
                        if (sticker.category === oldName) {
                            sticker.category = finalNewName;
                        }
                    });

                    await saveData();
                    renderCategoryList(); // 重新渲染列表
                    showToast(`分类已重命名为 "${finalNewName}"`);
                    return; // (^-^-^ 处理完毕 ^-^-^)
                }
            });
            // (^-^-^ 新增结束 ^-^-^)

            categoryManageBtn.addEventListener('click', () => {
                renderCategoryList();
                categoryModal.classList.add('visible');
            });

            closeCategoryModalBtn.addEventListener('click', () => {
                categoryModal.classList.remove('visible');
                renderStickerTabs(); // 刷新主弹窗的标签栏
                populateCategorySelects(); // 刷新上传弹窗的下拉菜单
            });

            addCategoryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newName = newCategoryInput.value.trim();
                if (newName && !db.stickerCategories.includes(newName)) {
                    db.stickerCategories.push(newName);
                    await saveData();
                    renderCategoryList();
                    newCategoryInput.value = '';
                } else if (!newName) {
                    showToast('分类名不能为空');
                } else {
                    showToast('分类名已存在');
                }
            });

            function renderCategoryList() {
                categoryListContainer.innerHTML = '';

                // (v-v-v 修复：确保 '全部' 和 '未分类' 始终存在且在最前 v-v-v)
                if (!db.stickerCategories) db.stickerCategories = [];
                if (!db.stickerCategories.includes('全部')) db.stickerCategories.unshift('全部');
                if (!db.stickerCategories.includes('未分类')) db.stickerCategories.splice(1, 0, '未分类');
                // (^-^-^ 修复结束 ^-^-^)

                db.stickerCategories.forEach(category => {
                    const item = document.createElement('div');
                    item.className = 'category-item';
                    item.dataset.category = category;

                    // (v-v-v 新增：添加编辑按钮 v-v-v)
                    let buttonsHtml = '';
                    // "全部" 和 "未分类" 不能被编辑或删除
                    if (category !== '全部' && category !== '未分类') {
                        buttonsHtml = `
                            <button type="button" class="category-action-btn category-edit-btn" title="重命名" data-category="${category}"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z" /></svg></button>
                            <button type="button" class="category-action-btn category-delete-btn" title="删除" data-category="${category}"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" /></svg></button>
                        `;
                    }

                    item.innerHTML = `
                        <span class="category-name">${category}</span>
                        <div class="category-actions">
                            ${buttonsHtml}
                        </div>
                    `;
                    // (^-^-^ 新增结束 ^-^-^)
                    categoryListContainer.appendChild(item);
                });

                // (v-v-v 修复：已删除旧的 querySelectorAll(...).forEach 循环 v-v-v)
            }

            // 搜索功能
            const stickerSearchInput = document.getElementById('sticker-search-input');
            stickerSearchInput.addEventListener('input', (e) => {
                currentStickerSearchTerm = e.target.value;
                renderStickerGrid();
            });

            addNewStickerBtn.addEventListener('click', () => {
                addStickerModalTitle.textContent = '添加新表情';
                addStickerForm.reset();
                stickerEditIdInput.value = '';
                stickerPreview.innerHTML = '<span>预览</span>';
                stickerUrlInput.disabled = false;
                if (typeof populateCategorySelects === 'function') populateCategorySelects();
                addStickerModal.classList.add('visible');
            });
            addStickerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = stickerNameInput.value.trim();
                const id = stickerEditIdInput.value;
                const previewImg = stickerPreview.querySelector('img');
                const data = previewImg ? previewImg.src : null;
                const catSelect = document.getElementById('sticker-category-select');
                const category = catSelect ? catSelect.value : '未分类';
                if (!name || !data) {
                    return showToast('请填写表情名称并提供图片');
                }
                const stickerData = {name, data, category};
                if (id) {
                    const index = db.myStickers.findIndex(s => s.id === id);
                    if (index > -1) {
                        db.myStickers[index] = {...db.myStickers[index], ...stickerData};
                    }
                } else {
                    stickerData.id = `sticker_${Date.now()}`;
                    db.myStickers.push(stickerData);
                }
                await saveData();
                renderStickerGrid();
                addStickerModal.classList.remove('visible');
                showToast('表情包已保存');
            });
            stickerUrlInput.addEventListener('input', (e) => {
                stickerPreview.innerHTML = `<img src="${e.target.value}" alt="预览">`;
                stickerFileUpload.value = '';
            });
            stickerFileUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const compressedUrl = await compressImage(file, {quality: 0.8, maxWidth: 200, maxHeight: 200});
                        stickerPreview.innerHTML = `<img src="${compressedUrl}" alt="预览">`;
                        stickerUrlInput.value = '';
                        stickerUrlInput.disabled = true;
                    } catch (error) {
                        console.error('表情包压缩失败:', error);
                        showToast('表情包压缩失败，请重试');
                    }
                }
            });
            editStickerBtn.addEventListener('click', () => {
                if (!currentStickerActionTarget) return;
                const sticker = db.myStickers.find(s => s.id === currentStickerActionTarget);
                if (sticker) {
                    addStickerModalTitle.textContent = '编辑表情';
                    stickerEditIdInput.value = sticker.id;
                    stickerNameInput.value = sticker.name;
                    stickerPreview.innerHTML = `<img src="${sticker.data}" alt="预览">`;
                    if (sticker.data.startsWith('http')) {
                        stickerUrlInput.value = sticker.data;
                        stickerUrlInput.disabled = false;
                    } else {
                        stickerUrlInput.value = '';
                        stickerUrlInput.disabled = true;
                    }
                    addStickerModal.classList.add('visible');
                }
                stickerActionSheet.classList.remove('visible');
                currentStickerActionTarget = null;
            });
            deleteStickerBtn.addEventListener('click', async () => {
                if (!currentStickerActionTarget) return;
                const sticker = db.myStickers.find(s => s.id === currentStickerActionTarget);
                if (sticker) {
                    if (confirm(`确定要删除表情"${sticker.name}"吗？`)) {
                        db.myStickers = db.myStickers.filter(s => s.id !== currentStickerActionTarget);
                        await saveData();
                        renderStickerGrid();
                        showToast('表情已删除');
                    }
                }
                stickerActionSheet.classList.remove('visible');
                currentStickerActionTarget = null;
            });
        }

        // --- Sticker categories/search state ---
        let currentStickerCategory = '全部';
        let currentStickerSearchTerm = '';

        function renderStickerTabs() {
            const tabsContainer = document.getElementById('sticker-category-tabs');
            if (!tabsContainer) return;
            tabsContainer.innerHTML = '';
            if (!db.stickerCategories || db.stickerCategories.length === 0) {
                db.stickerCategories = ['全部', '未分类'];
            }
            db.stickerCategories.forEach(category => {
                const tab = document.createElement('div');
                tab.className = 'tab-item';
                tab.textContent = category;
                tab.dataset.category = category;
                if (category === currentStickerCategory) tab.classList.add('active');
                tab.addEventListener('click', () => {
                    currentStickerCategory = category;
                    renderStickerGrid();
                });
                tabsContainer.appendChild(tab);
            });
        }

        /**
 * (替换) 渲染表情包网格 (v3 - 修复Bug 2)
 */
function renderStickerGrid() {
    // 1. 渲染分类标签栏 (每次都重新渲染以更新 active 状态)
    renderStickerTabs();

    // 2. 过滤表情包
    const stickerGridContainer = document.getElementById('sticker-grid-container');
    if (!stickerGridContainer) return;
    stickerGridContainer.innerHTML = '';

    const lowerSearchTerm = currentStickerSearchTerm.toLowerCase();

    const filteredStickers = db.myStickers.filter(sticker => {
        // 检查分类
        const category = sticker.category || '未分类';
        const categoryMatch = (currentStickerCategory === '全部') || (category === currentStickerCategory);
        if (!categoryMatch) return false;

        // 检查搜索词
        const nameMatch = sticker.name.toLowerCase().includes(lowerSearchTerm);
        if (!nameMatch) return false;

        return true;
    });

    // 3. 渲染过滤后的表情包
    if (filteredStickers.length === 0) {
        let placeholderText = '这个分类下还没有表情哦~';
        if (currentStickerSearchTerm) {
            placeholderText = '未找到匹配的表情';
        } else if (currentStickerCategory === '全部' && db.myStickers.length === 0) {
            placeholderText = '还没有表情包，快去上传吧！';
        }
        stickerGridContainer.innerHTML = `<p style="color:#aaa; text-align:center; grid-column: 1 / -1;">${placeholderText}</p>`;
    } else {
        filteredStickers.forEach(sticker => {
            const item = document.createElement('div');
            item.className = 'sticker-item';
            item.dataset.stickerId = sticker.id; // 添加data-stickerId属性用于全选功能
            item.innerHTML = `<img src="${sticker.data}" alt="${sticker.name}"><span>${DOMPurify.sanitize(sticker.name)}</span>`;

            if (isStickerManageMode) {
                item.classList.add('is-managing');
                if (selectedStickerIds.has(sticker.id)) {
                    item.classList.add('is-selected');
                }
                // 按照EPhone方式：不在这里绑定事件，使用全局事件委托
            } else {
                // 非管理模式下的原始逻辑
                item.addEventListener('click', () => sendSticker(sticker));
                item.addEventListener('contextmenu', (e) => { // 使用 contextmenu 替代 mousedown
                    e.preventDefault();
                    e.stopPropagation();
                    handleStickerLongPress(sticker.id);
                });
                item.addEventListener('touchstart', (e) => {
                    e.stopPropagation();
                    longPressTimer = setTimeout(() => {
                        handleStickerLongPress(sticker.id);
                    }, 500);
                });
                item.addEventListener('touchend', () => clearTimeout(longPressTimer));
                item.addEventListener('touchmove', () => clearTimeout(longPressTimer));
            }
            stickerGridContainer.appendChild(item);
        });
    }

    // 修复Bug 2：在管理模式下，每次重新渲染都要更新"全选"复选框的状态
    if (isStickerManageMode) {
        // 直接调用updateDeleteSelectedBtn，函数内部会重新获取元素引用
        updateDeleteSelectedBtn();
    }
}

        function handleStickerLongPress(stickerId) {
            if (isStickerManageMode) return;
            clearTimeout(longPressTimer);
            currentStickerActionTarget = stickerId;
            stickerActionSheet.classList.add('visible');
        }

        function setupVoiceMessageSystem() {
            voiceMessageBtn.addEventListener('click', () => {
                sendVoiceForm.reset();
                voiceDurationPreview.textContent = '0"';
                sendVoiceModal.classList.add('visible');
            });
            sendVoiceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                sendMyVoiceMessage(voiceTextInput.value.trim());
            });
        }

        function setupPhotoVideoSystem() {
            photoVideoBtn.addEventListener('click', () => {
                sendPvForm.reset();
                sendPvModal.classList.add('visible');
            });
            sendPvForm.addEventListener('submit', (e) => {
                e.preventDefault();
                sendMyPhotoVideo(pvTextInput.value.trim());
            });
        }

        function setupWalletSystem() {
            walletBtn.addEventListener('click', () => {
                if (currentChatType === 'private') {
                    sendTransferForm.reset();
                    sendTransferModal.classList.add('visible');
                } else if (currentChatType === 'group') {
                    currentGroupAction.type = 'transfer';
                    renderGroupRecipientSelectionList('转账给');
                    groupRecipientSelectionModal.classList.add('visible');
                }
            });
            sendTransferForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = transferAmountInput.value;
                const remark = transferRemarkInput.value.trim();
                if (amount > 0) {
                    sendMyTransfer(amount, remark);
                } else {
                    showToast('请输入有效的金额');
                }
            });
            acceptTransferBtn.addEventListener('click', () => respondToTransfer('received'));
            returnTransferBtn.addEventListener('click', () => respondToTransfer('returned'));
        }

        function handleReceivedTransferClick(messageId) {
            currentTransferMessageId = messageId;
            receiveTransferActionSheet.classList.add('visible');
        }

        async function respondToTransfer(action) {
            if (!currentTransferMessageId) return;
            const character = db.characters.find(c => c.id === currentChatId);
            const message = character.history.find(m => m.id === currentTransferMessageId);
            if (message) {
                message.transferStatus = action;
                const cardOnScreen = messageArea.querySelector(`.message-wrapper[data-id="${currentTransferMessageId}"] .transfer-card`);
                if (cardOnScreen) {
                    cardOnScreen.classList.remove('received', 'returned');
                    cardOnScreen.classList.add(action);
                    cardOnScreen.querySelector('.transfer-status').textContent = action === 'received' ? '已收款' : '已退回';
                    cardOnScreen.style.cursor = 'default';
                }
                let contextMessageContent = (action === 'received') ? `[${character.myName}接收${character.realName}的转账]` : `[${character.myName}退回${character.realName}的转账]`;
                const contextMessage = {
                    id: `msg_${Date.now()}`,
                    role: 'user',
                    content: contextMessageContent,
                    parts: [{type: 'text', text: contextMessageContent}],
                    timestamp: Date.now()
                };
                character.history.push(contextMessage);
                await saveData();
                renderChatList();
            }
            receiveTransferActionSheet.classList.remove('visible');
            currentTransferMessageId = null;
        }

        function setupGiftSystem() {
            giftBtn.addEventListener('click', () => {
                if (currentChatType === 'private') {
                    sendGiftForm.reset();
                    sendGiftModal.classList.add('visible');
                } else if (currentChatType === 'group') {
                    currentGroupAction.type = 'gift';
                    renderGroupRecipientSelectionList('送礼物给');
                    groupRecipientSelectionModal.classList.add('visible');
                }
            });
            sendGiftForm.addEventListener('submit', (e) => {
                e.preventDefault();
                sendMyGift(giftDescriptionInput.value.trim());
            });
        }

        function setupFontSettingsApp() {
            fontUrlInput.value = db.fontUrl;
            fontSettingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newFontUrl = fontUrlInput.value.trim();
                db.fontUrl = newFontUrl;
                await saveData();
                applyGlobalFont(newFontUrl);
                showToast('字体已保存并应用！');
            });
            restoreDefaultFontBtn.addEventListener('click', async () => {
                fontUrlInput.value = '';
                db.fontUrl = '';
                await saveData();
                applyGlobalFont('');
                showToast('已恢复默认字体！');
            });

            // --- ▼▼▼ 新增：绑定预设按钮事件 ▼▼▼ ---
            populateFontPresetSelect();
            
            // [新增] 为字体预设下拉框添加 'change' 事件监听器
            const fontPresetSelect = document.getElementById('font-preset-select');
            if (fontPresetSelect) {
                fontPresetSelect.addEventListener('change', () => {
                    if (fontPresetSelect.value) {
                        // 当用户选择时，立即调用 applyFontPreset
                        applyFontPreset(fontPresetSelect.value);
                    } else {
                        // 如果用户选回了 "— 选择预设 —"
                        const fontUrlInput = document.getElementById('font-url');
                        if(fontUrlInput) fontUrlInput.value = '';
                        applyGlobalFont(db.fontUrl); // 恢复到已保存的字体
                    }
                });
            }
            
            document.getElementById('font-save-preset')?.addEventListener('click', saveCurrentFontAsPreset);
            document.getElementById('font-manage-presets')?.addEventListener('click', openManageFontPresetsModal);
            document.getElementById('font-close-modal')?.addEventListener('click', () => {
                const modal = document.getElementById('font-presets-modal');
                if (modal) {
                    modal.classList.remove('visible');
                    modal.style.display = 'none';
                }
            });
            // --- ▲▲▲ 新增结束 ▲▲▲ ---
        }

        // --- ▼▼▼ 新增：字体预设辅助函数 ▼▼▼ ---
        function _getFontPresets() {
            return db.fontPresets || [];
        }
        function _saveFontPresets(arr) {
            db.fontPresets = arr || [];
            saveData();
        }

        function populateFontPresetSelect() {
            const sel = document.getElementById('font-preset-select');
            if (!sel) return;
            const presets = _getFontPresets();
            sel.innerHTML = '<option value="">— 选择预设 —</option>';
            presets.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.name;
                opt.textContent = p.name;
                sel.appendChild(opt);
            });
        }

        async function applyFontPreset(presetName) {
            const presets = _getFontPresets();
            const preset = presets.find(p => p.name === presetName);
            if (!preset) return showToast('未找到该预设');

            const fontUrlInput = document.getElementById('font-url');
            
            // 1. 填充输入框
            if (fontUrlInput) {
                fontUrlInput.value = preset.fontUrl;
            }
            
            // 2. [新增] 立即应用字体进行预览
            applyGlobalFont(preset.fontUrl);
            
            // 3. 提示用户
            showToast(`已预览 "${preset.name}" 字体`);
        }

        function saveCurrentFontAsPreset() {
            const fontUrl = fontUrlInput.value.trim();
            if (!fontUrl) return showToast('字体链接为空，无法保存');

            let name = prompt('请输入此字体预设的名称（同名将覆盖）:');
            if (!name) return;

            const presets = _getFontPresets();
            const existingIndex = presets.findIndex(p => p.name === name);
            if (existingIndex > -1) {
                presets[existingIndex].fontUrl = fontUrl;
            } else {
                presets.push({ name, fontUrl });
            }
            _saveFontPresets(presets);
            populateFontPresetSelect();
            showToast('字体预设已保存');
        }

        function openManageFontPresetsModal() {
            const modal = document.getElementById('font-presets-modal');
            const list = document.getElementById('font-presets-list');
            if (!modal || !list) return;

            // 显示模态框
            modal.style.display = 'flex';
            modal.classList.add('visible');

            list.innerHTML = '';
            const presets = _getFontPresets();
            if (!presets.length) list.innerHTML = '<p style="color:#888;margin:6px 0;">暂无预设</p>';

            presets.forEach((p, idx) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.padding = '8px 0';
                row.style.borderBottom = '1px solid #f0f0f0';

                const nameDiv = document.createElement('div');
                nameDiv.style.flex = '1';
                nameDiv.style.whiteSpace = 'nowrap';
                nameDiv.style.overflow = 'hidden';
                nameDiv.style.textOverflow = 'ellipsis';
                nameDiv.textContent = p.name;
                nameDiv.title = p.fontUrl;
                row.appendChild(nameDiv);

                const btnWrap = document.createElement('div');
                btnWrap.style.display = 'flex';
                btnWrap.style.gap = '6px';

                const applyBtn = document.createElement('button');
                applyBtn.className = 'btn btn-primary btn-xsmall';
                applyBtn.textContent = '应用';
                applyBtn.onclick = function() {
                    // 调用新的 applyFontPreset，它会填充输入框并实时预览
                    applyFontPreset(p.name); 
                    modal.classList.remove('visible');
                    modal.style.display = 'none';
                };

                const renameBtn = document.createElement('button');
                renameBtn.className = 'btn btn-xsmall';
                renameBtn.textContent = '重命名';
                renameBtn.onclick = function() {
                    const newName = prompt('输入新名称：', p.name);
                    if (!newName || newName === p.name) return;
                    _getFontPresets()[idx].name = newName;
                    _saveFontPresets(db.fontPresets);
                    openManageFontPresetsModal();
                    populateFontPresetSelect();
                };

                const delBtn = document.createElement('button');
                delBtn.className = 'btn btn-danger btn-xsmall';
                delBtn.textContent = '删除';
                delBtn.onclick = function() {
                    if (!confirm('确定删除预设 "' + p.name + '" ?')) return;
                    _getFontPresets().splice(idx, 1);
                    _saveFontPresets(db.fontPresets);
                    openManageFontPresetsModal();
                    populateFontPresetSelect();
                };

                btnWrap.appendChild(applyBtn);
                btnWrap.appendChild(renameBtn);
                btnWrap.appendChild(delBtn);
                row.appendChild(btnWrap);
                list.appendChild(row);
            });
        }
        // --- ▲▲▲ 新增结束 ▲▲▲ ---

        function applyGlobalFont(fontUrl) {
            const styleId = 'global-font-style';
            let styleElement = document.getElementById(styleId);
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }
            if (fontUrl) {
                const fontName = 'CustomGlobalFont';
                styleElement.innerHTML = `@font-face { font-family: '${fontName}'; src: url('${fontUrl}'); } :root { --font-family: '${fontName}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }`;
            } else {
                styleElement.innerHTML = `:root { --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }`;
            }
        }

        function applyGlobalCss(css) {
            const styleElement = document.getElementById('global-css-style');
            if (styleElement) {
                styleElement.innerHTML = css || '';
            }
        }

        function populateGlobalCssPresetSelect() {
            const select = document.getElementById('global-css-preset-select');
            if (!select) return;
            select.innerHTML = '<option value="">— 选择预设 —</option>';
            (db.globalCssPresets || []).forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.name;
                opt.textContent = p.name;
                select.appendChild(opt);
            });
        }

        function openGlobalCssManageModal() {
            const modal = document.getElementById('global-css-presets-modal');
            const list = document.getElementById('global-css-presets-list');
            if (!modal || !list) return;
            
            // 显示模态框
            modal.style.display = 'flex';
            modal.classList.add('visible');
            
            list.innerHTML = '';
            const presets = db.globalCssPresets || [];
            if (!presets.length) list.innerHTML = '<p style="color:#888;margin:6px 0;">暂无预设</p>';
            
            presets.forEach((p, idx) => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.padding = '8px 0';
                row.style.borderBottom = '1px solid #f0f0f0';
                
                const nameDiv = document.createElement('div');
                nameDiv.style.flex = '1';
                nameDiv.style.whiteSpace = 'nowrap';
                nameDiv.style.overflow = 'hidden';
                nameDiv.style.textOverflow = 'ellipsis';
                nameDiv.textContent = p.name;
                row.appendChild(nameDiv);

                const btnWrap = document.createElement('div');
                btnWrap.style.display = 'flex';
                btnWrap.style.gap = '6px';

                const applyBtn = document.createElement('button');
                applyBtn.className = 'btn btn-primary btn-xsmall';
                applyBtn.textContent = '应用';
                applyBtn.onclick = function() {
                    // 调用我们新定义的 applyGlobalCssPreset 函数
                    // (它在 renderCustomizeForm 作用域内)
                    const globalCssTextarea = document.getElementById('global-beautification-css');
                    if (globalCssTextarea) {
                        globalCssTextarea.value = p.css;
                        applyGlobalCss(p.css); // 实时预览
                        showToast(`已预览 "${p.name}"`);
                    }
                    modal.classList.remove('visible');
                    modal.style.display = 'none';
                };

                const renameBtn = document.createElement('button');
                renameBtn.className = 'btn btn-xsmall';
                renameBtn.textContent = '重命名';
                renameBtn.onclick = function() {
                    const newName = prompt('输入新名称：', p.name);
                    if (!newName || newName === p.name) return;
                    db.globalCssPresets[idx].name = newName;
                    saveData();
                    openGlobalCssManageModal();
                    populateGlobalCssPresetSelect();
                };

                const delBtn = document.createElement('button');
                delBtn.className = 'btn btn-danger btn-xsmall';
                delBtn.textContent = '删除';
                delBtn.onclick = function() {
                    if (!confirm('确定删除预设 "' + p.name + '" ?')) return;
                    db.globalCssPresets.splice(idx, 1);
                    saveData();
                    openGlobalCssManageModal();
                    populateGlobalCssPresetSelect();
                };

                btnWrap.appendChild(applyBtn);
                btnWrap.appendChild(renameBtn);
                btnWrap.appendChild(delBtn);
                row.appendChild(btnWrap);
                list.appendChild(row);
            });
        }

        function exportGlobalCssPresets() {
            const presets = db.globalCssPresets || [];
            if (presets.length === 0) {
                return showToast('没有可导出的CSS预设');
            }
            
            const fileContent = presets.map(p => 
                `/*! PRESET_NAME: ${p.name} */\n${p.css}\n`
            ).join('\n');
            
            const blob = new Blob([fileContent], { type: 'text/css;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `global_css_presets_${new Date().toISOString().slice(0, 10)}.css`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('CSS预设导出成功！');
        }

        function importGlobalCssPresets() {
            document.getElementById('import-global-css-input').click();
        }

        async function handleGlobalCssImport(file) {
            if (!file) return;
            showToast('正在导入CSS预设...');
            
            const fileContent = await file.text();
            
            try {
                const importedPresets = [];
                const parts = fileContent.split('/*! PRESET_NAME: ');
                
                if (parts.length <= 1) {
                    throw new Error('文件格式不正确，未找到 `/*! PRESET_NAME: ` 分隔符');
                }

                parts.shift();
                
                parts.forEach(part => {
                    const nameEndIndex = part.indexOf('*/');
                    if (nameEndIndex === -1) return;
                    
                    const name = part.substring(0, nameEndIndex).trim();
                    const css = part.substring(nameEndIndex + 2).trim();
                    
                    if (name && css) {
                        importedPresets.push({ name, css });
                    }
                });

                if (importedPresets.length === 0) {
                    return showToast('导入失败：未在文件中找到任何有效的预设');
                }

                if (confirm(`成功解析到 ${importedPresets.length} 个CSS预设。\n是否要将它们合并到您现有的预设库中？\n\n（同名预设将被覆盖）`)) {
                    if (!db.globalCssPresets) db.globalCssPresets = [];
                    
                    importedPresets.forEach(newPreset => {
                        const existingIndex = db.globalCssPresets.findIndex(p => p.name === newPreset.name);
                        if (existingIndex > -1) {
                            db.globalCssPresets[existingIndex] = newPreset;
                        } else {
                            db.globalCssPresets.push(newPreset);
                        }
                    });
                    
                    await saveData();
                    populateGlobalCssPresetSelect();
                    openGlobalCssManageModal();
                    showToast(`成功导入/更新 ${importedPresets.length} 个预设！`);
                }

            } catch (error) {
                console.error('CSS预设导入失败:', error);
                showToast(`导入失败: ${error.message}`);
            }
        }

  
        function setupWorldBookApp() {
            const worldBookListContainer = document.getElementById('world-book-list-container');
            const worldBookScreen = document.getElementById('world-book-screen'); // <-- 新增
            const noWorldBooksPlaceholder = document.getElementById('no-world-books-placeholder');
            const addWorldBookBtn = document.getElementById('add-world-book-btn');
            const editWorldBookForm = document.getElementById('edit-world-book-form');
            const worldBookIdInput = document.getElementById('world-book-id');
            const worldBookNameInput = document.getElementById('world-book-name');
            const worldBookCategoryInput = document.getElementById('world-book-category');
            const entriesContainer = document.getElementById('world-book-entries-container');
            const addEntryBtn = document.getElementById('add-world-book-entry-btn');

            const importWbBtn = document.getElementById('import-world-books-btn');
            const exportWbBtn = document.getElementById('export-world-books-btn');
            const importWbFileInput = document.getElementById('import-world-books-file-input');
            
            // 动作表和多选模式相关元素
            const worldBookMoreBtn = document.getElementById('world-book-more-btn');
            const worldBookActionSheet = document.getElementById('world-book-actionsheet');
            const worldBookActionSheetCancel = document.getElementById('world-book-actionsheet-cancel');
            const worldBookExportBtn = document.getElementById('world-book-export-btn');
            const worldBookImportBtn = document.getElementById('world-book-import-btn');
            const worldBookSelectBtn = document.getElementById('world-book-select-btn');
            const worldBookCancelSelectBtn = document.getElementById('world-book-cancel-select-btn');
            const worldBookHeaderNormal = document.getElementById('world-book-header-normal');
            const worldBookHeaderSelect = document.getElementById('world-book-header-select');
            const worldBookMultiSelectBar = document.getElementById('world-book-multi-select-bar');
            const worldBookSelectAllBtn = document.getElementById('world-book-select-all-btn');
            const worldBookDeleteSelectedBtn = document.getElementById('world-book-delete-selected-btn');
            
            // 使用全局多选模式状态（已在模块顶部定义）
            // isInWorldBookMultiSelectMode 和 selectedWorldBookIds 已在顶部定义

        
            addWorldBookBtn.addEventListener('click', () => {
                currentEditingWorldBookId = null;
                editWorldBookForm.reset();
                worldBookIdInput.value = '';
                worldBookNameInput.value = '';
                worldBookCategoryInput.value = '';
                document.querySelector('input[name="world-book-position"][value="before"]').checked = true;

                entriesContainer.innerHTML = '';
                const newBlock = createWorldBookEntryBlock();
                entriesContainer.appendChild(newBlock);

                switchScreen('edit-world-book-screen');
            });

            addEntryBtn.addEventListener('click', () => {
                const newBlock = createWorldBookEntryBlock();
                entriesContainer.appendChild(newBlock);
                entriesContainer.scrollTop = entriesContainer.scrollHeight;
            });

            if (exportWbBtn) {
                exportWbBtn.addEventListener('click', exportWorldBooks);
            }
            if (importWbBtn) {
                importWbBtn.addEventListener('click', () => {
                    importWbFileInput.click();
                });
            }
            if (importWbFileInput) {
                importWbFileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        handleWorldBookImport(file);
                    }
                    e.target.value = null;
                });
            }

            // 旧的点击事件监听器已移除，新的监听器在下方添加

            editWorldBookForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = worldBookNameInput.value.trim();
                const category = worldBookCategoryInput.value.trim();
                const position = document.querySelector('input[name="world-book-position"]:checked').value;
                
                const entryBlocks = entriesContainer.querySelectorAll('.world-book-entry-block');
                const newEntries = [];
                entryBlocks.forEach(block => {
                    const content = block.querySelector('.entry-content-textarea').value.trim();
                    if (content) {
                        const keysInput = block.querySelector('.entry-keys-input').value.trim();
                        newEntries.push({
                            enabled: block.querySelector('.entry-enabled-switch').checked,
                            keys: keysInput ? keysInput.split(',').map(k => k.trim().toLowerCase()).filter(k => k) : [],
                            comment: block.querySelector('.entry-comment-input').value.trim(),
                            content: content
                        });
                    }
                });

                if (!name) {
                    showToast('条目名称不能为空');
                    return;
                }
                if (newEntries.length === 0) {
                    showToast('至少需要一个有内容的子条目');
                    return;
                }

                const bookData = {
                    name: name,
                    content: newEntries,
                    position: position,
                    category: category
                };

                if (currentEditingWorldBookId) {
                    const book = db.worldBooks.find(wb => wb.id === currentEditingWorldBookId);
                    if (book) {
                        Object.assign(book, bookData);
                    }
                } else {
                    bookData.id = `wb_${Date.now()}`;
                    db.worldBooks.push(bookData);
                }

                await saveData();
                showToast('世界书条目已保存');
                renderWorldBookList();
                switchScreen('world-book-screen');
            });

            // 长按删除世界书条目逻辑
            // 使用统一的处理函数，避免重复触发
            function handleWorldBookDelete(bookId, bookName) {
                // 如果正在确认删除，直接返回
                if (isWorldBookDeleteConfirming) return;
                
                // 设置标志位，防止重复触发
                isWorldBookDeleteConfirming = true;
                
                // 清除所有可能运行的长按timer
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
                
                if (confirm(`确定要删除世界书条目"${bookName}"吗？此操作不可恢复。`)) {
                    deleteWorldBookById(bookId);
                } else {
                    // 如果用户取消，立即重置标志位
                    setTimeout(() => {
                        isWorldBookDeleteConfirming = false;
                    }, 100);
                }
            }
            
            worldBookListContainer.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const item = e.target.closest('.world-book-item');
                if (item && !e.target.closest('.action-btn')) {
                    const bookId = item.dataset.id;
                    const book = db.worldBooks.find(wb => wb.id === bookId);
                    if (book) {
                        handleWorldBookDelete(bookId, book.name);
                    }
                }
            });
            
            worldBookListContainer.addEventListener('touchstart', (e) => {
                const item = e.target.closest('.world-book-item');
                if (!item || e.target.closest('.action-btn')) return;
                // 如果正在确认删除，不再触发新的长按
                if (isWorldBookDeleteConfirming) return;
                
                // 先清除之前的timer（防止多次touchstart导致多个timer）
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                }
                
                longPressTimer = setTimeout(() => {
                    // 清除timer引用
                    longPressTimer = null;
                    const bookId = item.dataset.id;
                    const book = db.worldBooks.find(wb => wb.id === bookId);
                    if (book) {
                        handleWorldBookDelete(bookId, book.name);
                    }
                }, 500);
            });
            worldBookListContainer.addEventListener('mouseup', () => clearTimeout(longPressTimer));
            worldBookListContainer.addEventListener('mouseleave', () => clearTimeout(longPressTimer));
            worldBookListContainer.addEventListener('touchend', () => clearTimeout(longPressTimer));
            worldBookListContainer.addEventListener('touchmove', () => clearTimeout(longPressTimer));
            
            // ========== 动作表功能（改为下拉框） ==========
            // 点击"更多"按钮，弹出下拉框
            if (worldBookMoreBtn && worldBookActionSheet) {
                worldBookMoreBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // 切换显示/隐藏
                    if (worldBookActionSheet.classList.contains('visible')) {
                        worldBookActionSheet.classList.remove('visible');
                    } else {
                        worldBookActionSheet.classList.add('visible');
                    }
                });
            }
            
            // 点击下拉框外的区域，关闭下拉框
            document.addEventListener('click', (e) => {
                if (worldBookActionSheet && worldBookActionSheet.classList.contains('visible')) {
                    // 如果点击的不是下拉框内的元素，也不是"更多"按钮，则关闭
                    if (!worldBookActionSheet.contains(e.target) && 
                        !worldBookMoreBtn.contains(e.target)) {
                        worldBookActionSheet.classList.remove('visible');
                    }
                }
            });
            
            // 动作表中的按钮：导出
            if (worldBookExportBtn) {
                worldBookExportBtn.addEventListener('click', () => {
                    worldBookActionSheet.classList.remove('visible');
                    exportWorldBooks();
                });
            }
            
            // 动作表中的按钮：导入
            if (worldBookImportBtn) {
                worldBookImportBtn.addEventListener('click', () => {
                    worldBookActionSheet.classList.remove('visible');
                    if (importWbFileInput) {
                        importWbFileInput.click();
                    }
                });
            }
            
            // 动作表中的按钮：选择
            if (worldBookSelectBtn) {
                worldBookSelectBtn.addEventListener('click', () => {
                    worldBookActionSheet.classList.remove('visible');
                    enterWorldBookMultiSelectMode();
                });
            }
            
            // ========== 多选模式功能 ==========
            // 进入多选模式
            function enterWorldBookMultiSelectMode() {
                isInWorldBookMultiSelectMode = true;
                selectedWorldBookIds.clear();
                
                // 切换顶栏
                if (worldBookHeaderNormal) worldBookHeaderNormal.style.display = 'none';
                if (worldBookHeaderSelect) worldBookHeaderSelect.style.display = 'flex';
                
                // 显示底部多选栏
                if (worldBookMultiSelectBar) worldBookMultiSelectBar.style.display = 'flex';
                if (worldBookScreen) worldBookScreen.classList.add('multi-select-active'); // <-- 新增
                
                // 给所有条目和分类添加多选样式
                worldBookListContainer.querySelectorAll('.world-book-item').forEach(item => {
                    item.classList.add('is-selecting');
                });
                worldBookListContainer.querySelectorAll('.collapsible-header').forEach(header => {
                    header.classList.add('is-selecting');
                });
                worldBookListContainer.querySelectorAll('.collapsible-section').forEach(section => {
                    section.classList.add('is-selecting');
                });
                
                // 展开所有分类
                worldBookListContainer.querySelectorAll('.collapsible-section').forEach(section => {
                    section.classList.add('open');
                });
                
                updateDeleteButtonState();
            }
            
            // 退出多选模式
            function exitWorldBookMultiSelectMode() {
                isInWorldBookMultiSelectMode = false;
                selectedWorldBookIds.clear();
                
                // 切换顶栏
                if (worldBookHeaderNormal) worldBookHeaderNormal.style.display = 'flex';
                if (worldBookHeaderSelect) worldBookHeaderSelect.style.display = 'none';
                
                // 隐藏底部多选栏
                if (worldBookMultiSelectBar) worldBookMultiSelectBar.style.display = 'none';
                if (worldBookScreen) worldBookScreen.classList.remove('multi-select-active'); // <-- 新增
                
                // 移除所有多选样式
                worldBookListContainer.querySelectorAll('.world-book-item').forEach(item => {
                    item.classList.remove('is-selecting', 'selected');
                });
                worldBookListContainer.querySelectorAll('.collapsible-header').forEach(header => {
                    header.classList.remove('is-selecting', 'selected');
                });
                worldBookListContainer.querySelectorAll('.collapsible-section').forEach(section => {
                    section.classList.remove('is-selecting');
                });
            }
            
            // 切换条目选中状态
            function toggleWorldBookItemSelection(bookId) {
                if (!isInWorldBookMultiSelectMode) return;
                
                const item = worldBookListContainer.querySelector(`.world-book-item[data-id="${bookId}"]`);
                if (!item) return;
                
                if (selectedWorldBookIds.has(bookId)) {
                    selectedWorldBookIds.delete(bookId);
                    item.classList.remove('selected');
                } else {
                    selectedWorldBookIds.add(bookId);
                    item.classList.add('selected');
                }
                
                // 更新分类选中状态
                updateCategorySelectionState();
                updateDeleteButtonState();
            }
            
            // 切换分类选中状态
            function toggleCategorySelection(category) {
                if (!isInWorldBookMultiSelectMode) return;
                
                const section = worldBookListContainer.querySelector(`.collapsible-section[data-category="${category}"]`);
                if (!section) return;
                
                const header = section.querySelector('.collapsible-header');
                const items = section.querySelectorAll('.world-book-item');
                
                // 检查分类是否已全部选中
                const checkedCount = Array.from(items).filter(item => {
                    const bookId = item.dataset.id;
                    return selectedWorldBookIds.has(bookId);
                }).length;
                
                const allSelected = checkedCount === items.length && items.length > 0;
                
                if (allSelected) {
                    // 取消选中该分类下的所有条目
                    items.forEach(item => {
                        const bookId = item.dataset.id;
                        if (selectedWorldBookIds.has(bookId)) {
                            selectedWorldBookIds.delete(bookId);
                            item.classList.remove('selected');
                        }
                    });
                    if (header) {
                        header.classList.remove('selected', 'indeterminate');
                    }
                } else {
                    // 选中该分类下的所有条目
                    items.forEach(item => {
                        const bookId = item.dataset.id;
                        selectedWorldBookIds.add(bookId);
                        item.classList.add('selected');
                    });
                    if (header) {
                        header.classList.add('selected');
                        header.classList.remove('indeterminate');
                    }
                }
                
                updateDeleteButtonState();
            }
            
            // 更新分类选中状态（根据条目选中状态）
            function updateCategorySelectionState() {
                worldBookListContainer.querySelectorAll('.collapsible-section').forEach(section => {
                    const category = section.dataset.category;
                    const header = section.querySelector('.collapsible-header');
                    const items = section.querySelectorAll('.world-book-item');
                    
                    if (items.length === 0) {
                        // 没有条目时，移除所有状态
                        if (header) {
                            header.classList.remove('selected', 'indeterminate');
                        }
                        return;
                    }
                    
                    const checkedCount = Array.from(items).filter(item => {
                        const bookId = item.dataset.id;
                        return selectedWorldBookIds.has(bookId);
                    }).length;
                    
                    if (checkedCount === 0) {
                        // 全未选：移除所有状态
                        if (header) {
                            header.classList.remove('selected', 'indeterminate');
                        }
                    } else if (checkedCount === items.length) {
                        // 全选：显示选中状态（p3）
                        if (header) {
                            header.classList.add('selected');
                            header.classList.remove('indeterminate');
                        }
                    } else {
                        // 部分选中：显示部分选中状态（p2）
                        if (header) {
                            header.classList.add('indeterminate');
                            header.classList.remove('selected');
                        }
                    }
                });
            }
            
            // 更新删除按钮状态
            function updateDeleteButtonState() {
                if (worldBookDeleteSelectedBtn) {
                    const count = selectedWorldBookIds.size;
                    worldBookDeleteSelectedBtn.textContent = `删除 (${count})`;
                    if (count === 0) {
                        worldBookDeleteSelectedBtn.classList.add('disabled');
                    } else {
                        worldBookDeleteSelectedBtn.classList.remove('disabled');
                    }
                }
                
                // 更新全选按钮文字
                if (worldBookSelectAllBtn) {
                    const allItems = worldBookListContainer.querySelectorAll('.world-book-item');
                    const allSelected = allItems.length > 0 && Array.from(allItems).every(item => {
                        const bookId = item.dataset.id;
                        return selectedWorldBookIds.has(bookId);
                    });
                    worldBookSelectAllBtn.textContent = allSelected ? '取消全选' : '全选';
                }
            }
            
            // 全选/取消全选
            if (worldBookSelectAllBtn) {
                worldBookSelectAllBtn.addEventListener('click', () => {
                    if (!isInWorldBookMultiSelectMode) return;
                    
                    const allItems = worldBookListContainer.querySelectorAll('.world-book-item');
                    const allSelected = Array.from(allItems).every(item => {
                        const bookId = item.dataset.id;
                        return selectedWorldBookIds.has(bookId);
                    });
                    
                    if (allSelected) {
                        // 取消全选
                        selectedWorldBookIds.clear();
                        allItems.forEach(item => {
                            item.classList.remove('selected');
                        });
                        worldBookListContainer.querySelectorAll('.collapsible-header').forEach(header => {
                            header.classList.remove('selected');
                        });
                        // 更新按钮文字为"全选"
                        worldBookSelectAllBtn.textContent = '全选';
                    } else {
                        // 全选
                        allItems.forEach(item => {
                            const bookId = item.dataset.id;
                            selectedWorldBookIds.add(bookId);
                            item.classList.add('selected');
                        });
                        worldBookListContainer.querySelectorAll('.collapsible-header').forEach(header => {
                            header.classList.add('selected');
                        });
                        // 更新按钮文字为"取消全选"
                        worldBookSelectAllBtn.textContent = '取消全选';
                    }
                    
                    updateDeleteButtonState();
                });
            }
            
            // 批量删除
            if (worldBookDeleteSelectedBtn) {
                worldBookDeleteSelectedBtn.addEventListener('click', async () => {
                    if (selectedWorldBookIds.size === 0 || worldBookDeleteSelectedBtn.classList.contains('disabled')) return;
                    
                    const count = selectedWorldBookIds.size;
                    if (!confirm(`确定要删除选中的 ${count} 个世界书条目吗？此操作不可恢复。`)) {
                        return;
                    }
                    
                    const idsToDelete = Array.from(selectedWorldBookIds);
                    
                    // 批量删除（不调用renderWorldBookList，最后统一调用一次）
                    for (const bookId of idsToDelete) {
                        await dexieDB.worldBooks.delete(bookId);
                        db.worldBooks = db.worldBooks.filter(wb => wb.id !== bookId);
                        db.characters.forEach(char => {
                            if (char.worldBookIds) char.worldBookIds = char.worldBookIds.filter(id => id !== bookId);
                        });
                        db.groups.forEach(group => {
                            if (group.worldBookIds) group.worldBookIds = group.worldBookIds.filter(id => id !== bookId);
                        });
                    }
                    
                    await saveData();
                    exitWorldBookMultiSelectMode();
                    renderWorldBookList();
                    showToast(`已删除 ${count} 个条目`);
                });
            }
            
            // 取消多选模式
            if (worldBookCancelSelectBtn) {
                worldBookCancelSelectBtn.addEventListener('click', () => {
                    exitWorldBookMultiSelectMode();
                });
            }
            
            // 修改列表点击事件，支持多选模式
            // 先移除所有旧的点击监听器
            const oldClickHandler = worldBookListContainer._clickHandler;
            if (oldClickHandler) {
                worldBookListContainer.removeEventListener('click', oldClickHandler);
            }
            
            // 创建新的点击处理器（统一处理所有点击事件）
            const newClickHandler = (e => {
                // 多选模式下的点击处理
                if (isInWorldBookMultiSelectMode) {
                    // 阻止默认行为
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // 点击条目（整个条目都可以点击选中）
                    const worldBookItem = e.target.closest('.world-book-item');
                    if (worldBookItem) {
                        const bookId = worldBookItem.dataset.id;
                        toggleWorldBookItemSelection(bookId);
                        return;
                    }
                    
                    // 点击分类标题
                    const collapsibleHeader = e.target.closest('.collapsible-header');
                    if (collapsibleHeader) {
                        // 检查是否点击在复选框区域（左侧50px内）
                        const rect = collapsibleHeader.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const isClickingCheckbox = clickX < 50;
                        
                        if (isClickingCheckbox) {
                            // 点击复选框区域，切换分类选中状态
                            const section = collapsibleHeader.closest('.collapsible-section');
                            if (section) {
                                const category = section.dataset.category;
                                toggleCategorySelection(category);
                            }
                        } else {
                            // 点击分类标题的其他区域，展开/折叠
                            const section = collapsibleHeader.closest('.collapsible-section');
                            if (section) {
                                section.classList.toggle('open');
                            }
                        }
                        return;
                    }
                    
                    return; // 多选模式下，不执行编辑功能
                }
                
                // 非多选模式下的原有逻辑
                // 先检查是否是分类标题的点击（展开/折叠）
                if (e.target.closest('.collapsible-header')) {
                    e.stopPropagation(); // <-- ★★★ 修复"幽灵弹窗"BUG (泄露点A) ★★★
                    const section = e.target.closest('.collapsible-section');
                    if (section) {
                        section.classList.toggle('open');
                        return;
                    }
                }
                
                // 再检查是否是条目的点击（编辑）
                const worldBookItem = e.target.closest('.world-book-item');
                if (worldBookItem && !e.target.closest('.action-btn')) {
                    e.stopPropagation(); // <-- ★★★ 修复"幽灵弹窗"BUG (泄露点B) ★★★
                    const bookId = worldBookItem.dataset.id;
                    const book = db.worldBooks.find(wb => wb.id === bookId);
                    if (book) {
                        currentEditingWorldBookId = book.id;
                        worldBookIdInput.value = book.id;
                        worldBookNameInput.value = book.name;
                        worldBookCategoryInput.value = book.category || '';
                        document.querySelector(`input[name="world-book-position"][value="${book.position}"]`).checked = true;

                        entriesContainer.innerHTML = '';
                        if (Array.isArray(book.content) && book.content.length > 0) {
                            book.content.forEach(entry => {
                                const block = createWorldBookEntryBlock(entry);
                                entriesContainer.appendChild(block);
                            });
                        } else if (typeof book.content === 'string' && book.content) {
                            const oldContentEntry = {
                                enabled: true,
                                keys: [],
                                comment: '自动迁移的旧数据',
                                content: book.content
                            };
                            const block = createWorldBookEntryBlock(oldContentEntry);
                            entriesContainer.appendChild(block);
                        } else {
                            const newBlock = createWorldBookEntryBlock();
                            entriesContainer.appendChild(newBlock);
                        }

                        switchScreen('edit-world-book-screen');
                    }
                }
            });
            
            // 保存处理器引用，以便后续移除
            worldBookListContainer._clickHandler = newClickHandler;
            worldBookListContainer.addEventListener('click', newClickHandler);
        }

        // 删除世界书条目的辅助函数
        async function deleteWorldBookById(bookId) {
            // 清除所有可能运行的长按timer
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            // 重置标志位
            isWorldBookDeleteConfirming = false;
            
            await dexieDB.worldBooks.delete(bookId);
            db.worldBooks = db.worldBooks.filter(wb => wb.id !== bookId);
            db.characters.forEach(char => {
                if (char.worldBookIds) char.worldBookIds = char.worldBookIds.filter(id => id !== bookId);
            });
            db.groups.forEach(group => {
                if (group.worldBookIds) group.worldBookIds = group.worldBookIds.filter(id => id !== bookId);
            });
            await saveData();
            renderWorldBookList();
            showToast('世界书条目已删除');
        }

        // renderWorldBookList 函数
        function renderWorldBookList() {
            worldBookListContainer.innerHTML = '';
            noWorldBooksPlaceholder.style.display = db.worldBooks.length === 0 ? 'block' : 'none';
            if (db.worldBooks.length === 0) return;

            const groupedBooks = db.worldBooks.reduce((acc, book) => {
                const category = book.category || '未分类';
                if (!acc[category]) acc[category] = [];
                acc[category].push(book);
                return acc;
            }, {});

            const sortedCategories = Object.keys(groupedBooks).sort((a, b) => {
                if (a === '未分类') return 1;
                if (b === '未分类') return -1;
                return a.localeCompare(b);
            });

            sortedCategories.forEach(category => {
                const section = document.createElement('div');
                section.className = 'collapsible-section';
                section.dataset.category = category;

                const header = document.createElement('div');
                header.className = 'collapsible-header';

                // 删除分类删除按钮 (方案二 - 最终修订)
                // const deleteCategoryBtn = `<button type="button" class="category-delete-btn" title="删除整个分类" style="background: transparent; border: none; color: #e53935; font-size: 18px; cursor: pointer; padding: 4px 8px; margin-left: auto;">×</button>`;

                header.innerHTML = `
                    <h4 style="flex: 1; margin: 0;">${category}</h4>
                    <span class="collapsible-arrow">▼</span>
                `;

                // 分类删除按钮逻辑 (已删除)
                // const deleteBtn = header.querySelector('.category-delete-btn');
                // if (deleteBtn) {
                //     deleteBtn.addEventListener('click', async (e) => {
                //         e.preventDefault();
                //         e.stopPropagation();
                //         const booksInCategory = groupedBooks[category];
                //         if (confirm(`确定要删除整个分类"${category}"下的 ${booksInCategory.length} 个世界书条目吗？此操作不可恢复。`)) {
                //             const bookIdsToDelete = booksInCategory.map(b => b.id);
                //             await dexieDB.worldBooks.bulkDelete(bookIdsToDelete);
                //             db.worldBooks = db.worldBooks.filter(wb => !bookIdsToDelete.includes(wb.id));
                //             db.characters.forEach(char => {
                //                 if (char.worldBookIds) {
                //                     char.worldBookIds = char.worldBookIds.filter(id => !bookIdsToDelete.includes(id));
                //                 }
                //             });
                //             db.groups.forEach(group => {
                //                 if (group.worldBookIds) {
                //                     group.worldBookIds = group.worldBookIds.filter(id => !bookIdsToDelete.includes(id));
                //                 }
                //             });
                //             await saveData();
                //             renderWorldBookList();
                //             showToast(`已删除分类"${category}"下的 ${booksInCategory.length} 个条目`);
                //         }
                //     });
                // }

                const content = document.createElement('div');
                content.className = 'collapsible-content';
                const categoryList = document.createElement('ul');
                categoryList.className = 'list-container';
                categoryList.style.padding = '0';

                groupedBooks[category].forEach(book => {
                    const li = document.createElement('li');
                    li.className = 'list-item world-book-item';
                    li.dataset.id = book.id;

                    let contentPreview = '';
                    if (Array.isArray(book.content)) {
                        contentPreview = book.content.map(entry => entry.content || '').filter(c => c).join(' ').substring(0, 100);
                        if (contentPreview.length >= 100) contentPreview += '...';
                    } else if (typeof book.content === 'string') {
                        contentPreview = book.content.substring(0, 100);
                        if (book.content.length >= 100) contentPreview += '...';
                    } else {
                        contentPreview = '';
                    }
                    li.innerHTML = `<div class="item-details" style="padding-left: 0;"><div class="item-name">${book.name}</div><div class="item-preview">${contentPreview || '(无内容)'}</div></div>`;

                    // 单个删除按钮 (已删除 - 方案二 - 最终修订)
                    // const delBtn = document.createElement('button');
                    // delBtn.className = 'action-btn';
                    // delBtn.style.cssText = 'position: absolute; right: 8px; top: 50%; transform: translateY(-50%); padding: 6px; border: none; background: transparent;';
                    // delBtn.title = '删除世界书';
                    // delBtn.innerHTML = '<img src="https://i.postimg.cc/hGW6B0Wf/icons8-50.png" alt="删除" style="width: 22px; height: 22px; object-fit: contain;">';
                    // delBtn.addEventListener('click', async (ev) => {
                    //     ev.stopPropagation();
                    //     if (!confirm('确定要删除这个世界书条目吗？')) return;
                    //     await deleteWorldBookById(book.id);
                    // });
                    // li.style.position = 'relative';
                    // li.appendChild(delBtn);
                    categoryList.appendChild(li);
                });

                content.appendChild(categoryList);
                section.appendChild(header);
                section.appendChild(content);
                worldBookListContainer.appendChild(section);
            });
            
            // 如果当前在多选模式下，重新应用多选样式
            if (isInWorldBookMultiSelectMode) {
                worldBookListContainer.querySelectorAll('.world-book-item').forEach(item => {
                    item.classList.add('is-selecting');
                    if (selectedWorldBookIds.has(item.dataset.id)) {
                        item.classList.add('selected');
                    }
                });
                worldBookListContainer.querySelectorAll('.collapsible-header').forEach(header => {
                    header.classList.add('is-selecting');
                    const section = header.closest('.collapsible-section');
                    if (section) {
                        const items = section.querySelectorAll('.world-book-item');
                        const allSelected = Array.from(items).every(item => {
                            const bookId = item.dataset.id;
                            return selectedWorldBookIds.has(bookId);
                        });
                        if (allSelected && items.length > 0) {
                            header.classList.add('selected');
                        }
                    }
                });
                worldBookListContainer.querySelectorAll('.collapsible-section').forEach(section => {
                    section.classList.add('is-selecting');
                    section.classList.add('open'); // 多选模式下展开所有分类
                });
            }
        }

        function renderCategorizedWorldBookList(container, books, selectedIds, idPrefix) {
            container.innerHTML = '';
            if (!books || books.length === 0) {
                container.innerHTML = '<li style="color: #888; text-align: center; padding: 15px;">暂无世界书条目</li>';
                return;
            }

            const groupedBooks = books.reduce((acc, book) => {
                const category = book.category || '未分类';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(book);
                return acc;
            }, {});

            const sortedCategories = Object.keys(groupedBooks).sort((a, b) => {
                if (a === '未分类') return 1;
                if (b === '未分类') return -1;
                return a.localeCompare(b);
            });

            sortedCategories.forEach(category => {
                const categoryBooks = groupedBooks[category];
                const allInCategorySelected = categoryBooks.every(book => selectedIds.includes(book.id));

                const groupEl = document.createElement('div');
                groupEl.className = 'world-book-category-group';

                groupEl.innerHTML = `
                    <div class="world-book-category-header">
                        <input type="checkbox" class="category-checkbox" ${allInCategorySelected ? 'checked' : ''}>
                        <span class="category-name">${category}</span>
                        <span class="category-arrow">▼</span>
                    </div>
                    <ul class="world-book-items-list">
                        ${categoryBooks.map(book => {
                            const isChecked = selectedIds.includes(book.id);
                            return `
                                <li class="world-book-select-item" data-book-id="${book.id}">
                                    <input type="checkbox" class="item-checkbox" id="${idPrefix}-${book.id}" value="${book.id}" ${isChecked ? 'checked' : ''}>
                                    <label for="${idPrefix}-${book.id}">${DOMPurify.sanitize(book.name)}</label>
                                    
                                    <div class="btn-group">
                                        <button type="button" class="btn-action btn-action-edit" data-action="edit" data-book-id="${book.id}">重命名</button>
                                        <button type="button" class="btn-action btn-action-delete" data-action="delete" data-book-id="${book.id}">删除</button>
                                    </div>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                `;
                container.appendChild(groupEl);
            });

            // --- 新增：为弹窗内的 "编辑" 和 "删除" 按钮添加事件委托 ---
            // 确保只添加一次监听器
            if (!container._listenerAttached) {
                container.addEventListener('click', async (e) => {
                    const editBtn = e.target.closest('.btn-action-edit');
                    const deleteBtn = e.target.closest('.btn-action-delete');

                    // --- 处理 "重命名" 按钮 ---
                    if (editBtn) {
                        e.stopPropagation(); // 关键：阻止事件穿透，修复弹窗Bug
                        const bookId = editBtn.dataset.bookId;
                        const book = db.worldBooks.find(wb => wb.id === bookId);

                        if (book) {
                            const newName = prompt(`请输入 "${book.name}" 的新名称：`, book.name);

                            if (newName && newName.trim() !== "" && newName.trim() !== book.name) {
                                // 1. 更新数据库中的名字
                                book.name = newName.trim();
                                await saveData();

                                // 2. 重新渲染当前弹窗的列表（保持选中状态）
                                const currentSelectedIds = Array.from(container.querySelectorAll('.item-checkbox:checked')).map(cb => cb.value);
                                renderCategorizedWorldBookList(container, db.worldBooks, currentSelectedIds, idPrefix);

                                // 3. 重新渲染主界面的世界书列表
                                if (typeof renderWorldBookList === 'function') {
                                    renderWorldBookList();
                                }
                                showToast('重命名成功！');
                            } else if (newName === null) {
                                // 用户点击了 "取消"
                            } else {
                                // 用户点击了 "确定"，但名字是空的或没变
                                showToast('名称未更改。');
                            }
                        }
                    }

                    // --- 处理 "删除" 按钮 (已修复"闪退"Bug) ---
                    if (deleteBtn) {
                        e.stopPropagation(); // 阻止触发li上的其他事件
                        const bookId = deleteBtn.dataset.bookId;
                        const book = db.worldBooks.find(wb => wb.id === bookId);
                        
                        if (book && confirm(`确定要删除世界书条目"${book.name}"吗？\n此操作不可恢复，且会从所有角色的关联中移除。`)) {
                            // 1. 从数据库和内存中删除
                            await dexieDB.worldBooks.delete(bookId);
                            db.worldBooks = db.worldBooks.filter(wb => wb.id !== bookId);
                            
                            // 2. 从所有角色和群聊的关联中移除
                            db.characters.forEach(char => {
                                if (char.worldBookIds) char.worldBookIds = char.worldBookIds.filter(id => id !== bookId);
                            });
                            db.groups.forEach(group => {
                                if (group.worldBookIds) group.worldBookIds = group.worldBookIds.filter(id => id !== bookId);
                            });
                            // 3. 从论坛绑定中移除
                            if (db.forumBindings && db.forumBindings.worldBookIds) {
                                db.forumBindings.worldBookIds = db.forumBindings.worldBookIds.filter(id => id !== bookId);
                            }
                            
                            await saveData();
                            
                            // 4. 重新渲染当前弹窗的列表
                            // (我们需要获取当前选中的ID，以保持状态)
                            const currentSelectedIds = Array.from(container.querySelectorAll('.item-checkbox:checked')).map(cb => cb.value);
                            renderCategorizedWorldBookList(container, db.worldBooks, currentSelectedIds, idPrefix);
                            
                            // 5. 重新渲染主界面的世界书列表（以便关闭弹窗后数据同步）
                            if (typeof renderWorldBookList === 'function') {
                                renderWorldBookList();
                            }
                            showToast('条目已删除');
                        }
                    }
                });
                container._listenerAttached = true; // 标记已添加监听器
            }
            // --- 新增代码结束 ---

            // Add event listeners
            container.querySelectorAll('.world-book-category-header').forEach(header => {
                header.addEventListener('click', (e) => {
                    if (e.target.type === 'checkbox') return; // Don't toggle if clicking checkbox
                    const group = header.closest('.world-book-category-group');
                    group.classList.toggle('open');
                });
            });

            container.querySelectorAll('.category-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const group = e.target.closest('.world-book-category-group');
                    const itemCheckboxes = group.querySelectorAll('.item-checkbox');
                    itemCheckboxes.forEach(itemCb => {
                        itemCb.checked = e.target.checked;
                    });
                });
            });

            container.querySelectorAll('.item-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const group = e.target.closest('.world-book-category-group');
                    const categoryCheckbox = group.querySelector('.category-checkbox');
                    const allItems = group.querySelectorAll('.item-checkbox');
                    const allChecked = Array.from(allItems).every(item => item.checked);
                    categoryCheckbox.checked = allChecked;
                });
            });
        }

        function setupChatSettings() {
            const themeSelect = document.getElementById('setting-theme-color');
            themeSelect.innerHTML = '';
            Object.keys(colorThemes).forEach(key => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = colorThemes[key].name;
                themeSelect.appendChild(option);
            });

            // [新增] 为"主题颜色"下拉框添加 change 事件监听
            themeSelect.addEventListener('change', () => {
                const useCustomCss = document.getElementById('setting-use-custom-css').checked;
                // 只有在"未勾选"自定义CSS时，才允许主题颜色更新预览
                if (!useCustomCss) {
                    const theme = colorThemes[themeSelect.value] || colorThemes['white_pink'];
                    const previewBox = document.getElementById('private-bubble-css-preview');
                    updateBubbleCssPreview(previewBox, '', true, theme);
                }
            });

            chatSettingsBtn.addEventListener('click', () => {
                if (currentChatType === 'private') {
                    // 1. 立即开始动画
                    settingsSidebar.classList.add('open');
                    // 2. 异步加载内容
                    setTimeout(() => {
                        loadSettingsToSidebar();
                    }, 0); // 0ms 延迟，推到下一个事件循环
                } else if (currentChatType === 'group') {
                    // 1. 立即开始动画
                    groupSettingsSidebar.classList.add('open');
                    // 2. 异步加载内容
                    setTimeout(() => {
                        loadGroupSettingsToSidebar();
                    }, 0); // 0ms 延迟，推到下一个事件循环
                }
            });
            document.querySelector('.phone-screen').addEventListener('click', e => {
                const openSidebar = document.querySelector('.settings-sidebar.open');
                if (openSidebar && !openSidebar.contains(e.target) && !e.target.closest('.action-btn') && !e.target.closest('.modal-overlay') && !e.target.closest('.action-sheet-overlay')) {
                    openSidebar.classList.remove('open');
                }
            });

            settingsForm.addEventListener('submit', e => {
                e.preventDefault();
                saveSettingsFromSidebar();
                settingsSidebar.classList.remove('open');
            });
            const useCustomCssCheckbox = document.getElementById('setting-use-custom-css'),
                customCssTextarea = document.getElementById('setting-custom-bubble-css'),
                resetCustomCssBtn = document.getElementById('reset-custom-bubble-css-btn'),
                privatePreviewBox = document.getElementById('private-bubble-css-preview');
            useCustomCssCheckbox.addEventListener('change', (e) => {
                customCssTextarea.disabled = !e.target.checked;
                const char = db.characters.find(c => c.id === currentChatId);
                if (char) {
                    // [修改] 从下拉框实时获取主题，而不是从数据库
                    const themeKey = document.getElementById('setting-theme-color').value || 'white_pink';
                    const theme = colorThemes[themeKey];

                    if (e.target.checked) {
                        // 如果勾选，预览输入框的内容
                        updateBubbleCssPreview(privatePreviewBox, customCssTextarea.value, false, theme);
                    } else {
                        // 如果取消勾选，预览当前选择的主题
                        updateBubbleCssPreview(privatePreviewBox, '', true, theme);
                    }
                }
            });
            customCssTextarea.addEventListener('input', (e) => {
                const char = db.characters.find(c => c.id === currentChatId);
                if (char && useCustomCssCheckbox.checked) {
                    const themeKey = char.theme || 'white_pink';
                    const theme = colorThemes[themeKey];
                    updateBubbleCssPreview(privatePreviewBox, e.target.value, false, theme);
                }
            });
            resetCustomCssBtn.addEventListener('click', () => {
                const char = db.characters.find(c => c.id === currentChatId);
                if (char) {
                    customCssTextarea.value = '';
                    useCustomCssCheckbox.checked = false;
                    customCssTextarea.disabled = true;
                    const themeKey = char.theme || 'white_pink';
                    const theme = colorThemes[themeKey];
                    updateBubbleCssPreview(privatePreviewBox, '', true, theme);
                    showToast('样式已重置为默认');
                }
            });
            document.getElementById('setting-char-avatar-upload').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const compressedUrl = await compressImage(file, {quality: 0.8, maxWidth: 400, maxHeight: 400});
                        document.getElementById('setting-char-avatar-preview').src = compressedUrl;
                    } catch (error) {
                        showToast('头像压缩失败，请重试');
                    }
                }
            });
            document.getElementById('setting-my-avatar-upload').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const compressedUrl = await compressImage(file, {quality: 0.8, maxWidth: 400, maxHeight: 400});
                        document.getElementById('setting-my-avatar-preview').src = compressedUrl;
                    } catch (error) {
                        showToast('头像压缩失败，请重试');
                    }
                }
            });
            document.getElementById('setting-chat-bg-upload').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const char = db.characters.find(c => c.id === currentChatId);
                    if (char) {
                        try {
                            const compressedUrl = await compressImage(file, {
                                quality: 0.85,
                                maxWidth: 1080,
                                maxHeight: 1920
                            });
                            char.chatBg = compressedUrl;
                            chatRoomScreen.style.backgroundImage = `url(${compressedUrl})`;
                            await saveData();
                            showToast('聊天背景已更换');
                        } catch (error) {
                            showToast('背景压缩失败，请重试');
                        }
                    }
                }
            });
            clearChatHistoryBtn.addEventListener('click', async () => {
                const character = db.characters.find(c => c.id === currentChatId);
                if (!character) return;
                if (confirm(`你确定要清空与“${character.remarkName}”的所有聊天记录吗？这个操作是不可恢复的！`)) {
                    character.history = [];
                    character.status = '在线'; // 重置状态
                    await saveData();
                    renderMessages(false, true);
                    renderChatList();
                    // 更新聊天室顶部的状态显示
                    if (currentChatId === character.id) {
                        document.getElementById('chat-room-status-text').textContent = '在线';
                    }
                    settingsSidebar.classList.remove('open');
                    showToast('聊天记录已清空');
                }
            });
            linkWorldBookBtn.addEventListener('click', () => {
                const character = db.characters.find(c => c.id === currentChatId);
                if (!character) return;
                renderCategorizedWorldBookList(worldBookSelectionList, db.worldBooks, character.worldBookIds || [], 'wb-select');
                worldBookSelectionModal.classList.add('visible');
            });

            saveWorldBookSelectionBtn.addEventListener('click', async () => {
                const selectedIds = Array.from(worldBookSelectionList.querySelectorAll('.item-checkbox:checked')).map(input => input.value);
                if (currentChatType === 'private') {
                    const character = db.characters.find(c => c.id === currentChatId);
                    if (character) character.worldBookIds = selectedIds;
                } else if (currentChatType === 'group') {
                    const group = db.groups.find(g => g.id === currentChatId);
                    if (group) group.worldBookIds = selectedIds;
                }
                await saveData();
                worldBookSelectionModal.classList.remove('visible');
                showToast('世界书关联已更新');
            });
            
            // ▼▼▼ 新增：绑定"NAI 模块手册"按钮 (私聊) ▼▼▼
            const openNaiManagerBtn = document.getElementById('open-nai-module-manager-btn');
            if (openNaiManagerBtn) {
                openNaiManagerBtn.addEventListener('click', () => {
                    openNaiModuleManageModal();
                });
            }
            // ▲▲▲ 新增结束 ▲▲▲
        }

        function loadSettingsToSidebar() {
            const e = db.characters.find(e => e.id === currentChatId);
            if (e) {
                document.getElementById('setting-char-avatar-preview').src = e.avatar;
                document.getElementById('setting-char-remark').value = e.remarkName;
                document.getElementById('setting-char-persona').value = e.persona;
                document.getElementById('setting-my-avatar-preview').src = e.myAvatar;
                document.getElementById('setting-my-name').value = e.myName;
                document.getElementById('setting-my-persona').value = e.myPersona;
                document.getElementById('setting-theme-color').value = e.theme || 'white_pink';
                document.getElementById('setting-max-memory').value = e.maxMemory;
                const useCustomCssCheckbox = document.getElementById('setting-use-custom-css'),
                    customCssTextarea = document.getElementById('setting-custom-bubble-css'),
                    privatePreviewBox = document.getElementById('private-bubble-css-preview');
                useCustomCssCheckbox.checked = e.useCustomBubbleCss || false;
                customCssTextarea.value = e.customBubbleCss || '';
                customCssTextarea.disabled = !useCustomCssCheckbox.checked;
                const theme = colorThemes[e.theme || 'white_pink'];
                updateBubbleCssPreview(privatePreviewBox, e.customBubbleCss, !e.useCustomBubbleCss, theme);
                populateBubblePresetSelect('bubble-preset-select');
                populateMyPersonaSelect();
            }

        }

        async function saveSettingsFromSidebar() {
            const e = db.characters.find(e => e.id === currentChatId);
            if (e) {
                e.avatar = document.getElementById('setting-char-avatar-preview').src;
                e.remarkName = document.getElementById('setting-char-remark').value;
                e.persona = document.getElementById('setting-char-persona').value;
                e.myAvatar = document.getElementById('setting-my-avatar-preview').src;
                e.myName = document.getElementById('setting-my-name').value;
                e.myPersona = document.getElementById('setting-my-persona').value;
                e.theme = document.getElementById('setting-theme-color').value;
                e.maxMemory = document.getElementById('setting-max-memory').value;
                e.useCustomBubbleCss = document.getElementById('setting-use-custom-css').checked;
                e.customBubbleCss = document.getElementById('setting-custom-bubble-css').value;
                await saveData();
                showToast('设置已保存！');
                chatRoomTitle.textContent = e.remarkName;
                renderChatList();
                updateCustomBubbleStyle(currentChatId, e.customBubbleCss, e.useCustomBubbleCss);
                currentPage = 1;
                renderMessages(false, true);
            }
        }

        function setupApiSettingsApp() {
            const e = document.getElementById('api-form'), t = document.getElementById('fetch-models-btn'),
                a = document.getElementById('api-model'), n = document.getElementById('api-provider'),
                r = document.getElementById('api-url'), s = document.getElementById('api-key'), c = {
                    newapi: '',
                    deepseek: 'https://api.deepseek.com',
                    claude: 'https://api.anthropic.com',
                    gemini: 'https://generativelanguage.googleapis.com'
                };
            db.apiSettings && (n.value = db.apiSettings.provider || 'newapi', r.value = db.apiSettings.url || '', s.value = db.apiSettings.key || '', db.apiSettings.model && (a.innerHTML = `<option value="${db.apiSettings.model}">${db.apiSettings.model}</option>`));
            if (db.apiSettings && typeof db.apiSettings.timePerceptionEnabled !== 'undefined') { document.getElementById('time-perception-switch').checked = db.apiSettings.timePerceptionEnabled; }

            // --- NovelAI 初始化 ---
            const novelaiEnabled = localStorage.getItem('novelai-enabled') === 'true';
            const novelaiApiKey = localStorage.getItem('novelai-api-key') || '';
            const novelaiModel = localStorage.getItem('novelai-model') || 'nai-diffusion-4-5-full';
            
            if (novelaiSwitch) {
                novelaiSwitch.checked = novelaiEnabled;
                if (novelaiDetailsDiv) {
                    novelaiDetailsDiv.style.display = novelaiEnabled ? 'block' : 'none';
                }
            }
            if (novelaiApiKeyInput) {
                novelaiApiKeyInput.value = novelaiApiKey;
            }
            if (novelaiModelSelect) {
                novelaiModelSelect.value = novelaiModel;
            }
            // --- NovelAI 初始化结束 ---

            populateApiSelect();
            n.addEventListener('change', () => {
                r.value = c[n.value] || ''
            });
            t.addEventListener('click', async () => {
                let o = r.value.trim();
                const l = s.value.trim();
                if (!o || !l) return showToast('请先填写API地址和密钥！');
                o.endsWith('/') && (o = o.slice(0, -1));
                const i = 'gemini' === n.value ? `${o}/v1beta/models?key=${getRandomValue(l)}` : `${o}/v1/models`;
                t.classList.add('loading'), t.disabled = !0;
                try {
                    const d = 'gemini' === n.value ? {} : {Authorization: `Bearer ${l}`},
                        g = await fetch(i, {method: 'GET', headers: d});
                    if (!g.ok) {
                        const error = new Error(`网络响应错误: ${g.status}`);
                        error.response = g;
                        throw error;
                    }
                    const u = await g.json();
                    let p = [];
                    'gemini' !== n.value && u.data ? p = u.data.map(e => e.id) : 'gemini' === n.value && u.models && (p = u.models.map(e => e.name.replace('models/', ''))), a.innerHTML = '', p.length > 0 ? p.forEach(e => {
                        const t = document.createElement('option');
                        t.value = e, t.textContent = e, a.appendChild(t)
                    }) : a.innerHTML = '<option value="">未找到任何模型</option>', showToast('模型列表拉取成功！')
                } catch (f) {
                    showApiError(f), a.innerHTML = '<option value="">拉取失败</option>'
                } finally {
                    t.classList.remove('loading'), t.disabled = !1
                }
            });
            e.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!a.value) return showToast('请选择模型后保存！');
    // 在这里，我们把开关的状态也一起保存进去
    db.apiSettings = {
        provider: n.value,
        url: r.value,
        key: s.value,
        model: a.value,
        timePerceptionEnabled: document.getElementById('time-perception-switch').checked
    };
    await saveData();
    showToast('API设置已保存！')
})
        
        // ▼▼▼ 新增：绑定 NAI 全局预设按钮事件 ▼▼▼
        const naiPresetSelect = document.getElementById('nai-global-prompt-preset-select');
        const naiPresetApplyBtn = document.getElementById('nai-global-prompt-apply-preset');
        const naiPresetSaveBtn = document.getElementById('nai-global-prompt-save-preset');
        const naiPresetManageBtn = document.getElementById('nai-global-prompt-manage-presets');
        const naiPresetCloseModalBtn = document.getElementById('nai-global-prompt-close-modal');

        // [新增] 为 NAI 预设下拉框添加 'change' 事件监听器
        if (naiPresetSelect) {
            naiPresetSelect.addEventListener('change', () => {
                if (naiPresetSelect.value) {
                    // 当用户选择时，立即调用 applyNaiPromptPreset
                    applyNaiPromptPreset(naiPresetSelect.value);
                } else {
                    // 如果用户选回 "— 选择预设 —"
                    // 恢复到已保存的默认值
                    const settings = getNovelAISettings();
                    const positiveEl = document.getElementById('nai-default-positive');
                    const negativeEl = document.getElementById('nai-default-negative');
                    if (positiveEl) positiveEl.value = settings.default_positive || '';
                    if (negativeEl) negativeEl.value = settings.default_negative || '';
                }
            });
        }
        if (naiPresetSaveBtn) {
            naiPresetSaveBtn.addEventListener('click', saveCurrentNaiPromptPreset);
        }
        if (naiPresetManageBtn) {
            naiPresetManageBtn.addEventListener('click', openNaiPromptPresetManageModal);
        }
        if (naiPresetCloseModalBtn) {
            naiPresetCloseModalBtn.addEventListener('click', () => {
                const modal = document.getElementById('nai-global-prompt-presets-modal');
                if (modal) modal.classList.remove('visible');
            });
        }
        // ▲▲▲ 新增结束 ▲▲▲
        }
       function setupPresetFeatures() {
           // API Presets
           const saveBtn = document.getElementById('api-save-preset');
           const manageBtn = document.getElementById('api-manage-presets');
           const select = document.getElementById('api-preset-select');
           const modalClose = document.getElementById('api-close-modal');

           if (saveBtn) saveBtn.addEventListener('click', saveCurrentApiAsPreset);
           if (manageBtn) manageBtn.addEventListener('click', openApiManageModal);

           if (select) {
               select.addEventListener('change', function() {
                   const v = select.value;
                   if (v) {
                       applyApiPreset(v);
                   }
               });
           }

           if (modalClose) modalClose.addEventListener('click', function(){
               const modal = document.getElementById('api-presets-modal');
               if (modal) {
                   modal.classList.remove('visible');
                   modal.style.display = 'none';
               }
           });
           
           // Bubble CSS Presets
           const bubbleSaveBtn = document.getElementById('save-preset-btn');
           const bubbleManageBtn = document.getElementById('manage-presets-btn');
           const bubbleModalClose = document.getElementById('close-presets-modal');
           const bubbleSelect = document.getElementById('bubble-preset-select');
           const groupBubbleSaveBtn = document.getElementById('group-save-preset-btn');
           const groupBubbleManageBtn = document.getElementById('group-manage-presets-btn');
           const groupBubbleSelect = document.getElementById('group-bubble-preset-select');

           if (bubbleModalClose) bubbleModalClose.addEventListener('click', function(){
               const modal = document.getElementById('bubble-presets-modal');
               if (modal) {
                   modal.classList.remove('visible');
                   modal.style.display = 'none';
               }
           });

           // [已删除] bubbleApplyBtn 和 groupBubbleApplyBtn 监听器

           if (bubbleSaveBtn) bubbleSaveBtn.addEventListener('click', saveCurrentTextareaAsPreset);
           if (bubbleManageBtn) bubbleManageBtn.addEventListener('click', openManagePresetsModal);

           // [新增] 气泡预设下拉框（私聊）的 "选择即预览" 逻辑
           if (bubbleSelect) {
               bubbleSelect.addEventListener('change', () => {
                   const selVal = bubbleSelect.value;
                   if (selVal) {
                       applyPresetToCurrentChat(selVal);
                   } else {
                       // [新增] 用户选回了"— 选择预设 —"
                       const textarea = document.getElementById('setting-custom-bubble-css');
                       const checkbox = document.getElementById('setting-use-custom-css');
                       if (textarea) textarea.value = '';
                       if (checkbox) checkbox.checked = false; // 取消勾选
                       if (textarea) textarea.disabled = true; // 禁用

                       // 恢复到已保存的主题
                       const chat = db.characters.find(c => c.id === currentChatId);
                       const themeKey = chat ? chat.theme : 'white_pink';
                       const theme = colorThemes[themeKey] || colorThemes['white_pink'];
                       const previewBox = document.getElementById('private-bubble-css-preview');
                       updateBubbleCssPreview(previewBox, '', true, theme);
                   }
               });
           }

           if (groupBubbleSaveBtn) groupBubbleSaveBtn.addEventListener('click', saveCurrentTextareaAsPreset);
           if (groupBubbleManageBtn) groupBubbleManageBtn.addEventListener('click', openManagePresetsModal);

           // [新增] 气泡预设下拉框（群聊）的 "选择即预览" 逻辑
           if (groupBubbleSelect) {
               groupBubbleSelect.addEventListener('change', () => {
                   const selVal = groupBubbleSelect.value;
                   if (selVal) {
                       applyPresetToCurrentChat(selVal);
                   } else {
                       // [新增] 用户选回了"— 选择预设 —"
                       const textarea = document.getElementById('setting-group-custom-bubble-css');
                       const checkbox = document.getElementById('setting-group-use-custom-css');
                       if (textarea) textarea.value = '';
                       if (checkbox) checkbox.checked = false; // 取消勾选
                       if (textarea) textarea.disabled = true; // 禁用

                       // 恢复到已保存的主题
                       const chat = db.groups.find(g => g.id === currentChatId);
                       const themeKey = chat ? chat.theme : 'white_pink';
                       const theme = colorThemes[themeKey] || colorThemes['white_pink'];
                       const previewBox = document.getElementById('group-bubble-css-preview');
                       updateBubbleCssPreview(previewBox, '', true, theme);
                   }
               });
           }

           // My Persona Presets
           const personaSaveBtn = document.getElementById('mypersona-save-btn');
           const personaManageBtn = document.getElementById('mypersona-manage-btn');
           const personaSelect = document.getElementById('mypersona-preset-select');
           const personaModalClose = document.getElementById('mypersona-close-modal');

           if (personaSaveBtn) personaSaveBtn.addEventListener('click', saveCurrentMyPersonaAsPreset);
           if (personaManageBtn) personaManageBtn.addEventListener('click', openManageMyPersonaModal);

           // [新增] 人设预设下拉框的 "选择即预览" 逻辑
           if (personaSelect) {
               personaSelect.addEventListener('change', function(){
                   const v = personaSelect.value;
                   if(v) {
                       applyMyPersonaPresetToCurrentChat(v); // 调用修改后的预览函数
                   } else {
                       // [新增] 用户选回了"— 选择预设 —"，清空输入框
                       const personaEl = document.getElementById('setting-my-persona') || document.getElementById('setting-group-my-persona');
                       const avatarEl = document.getElementById('setting-my-avatar-preview') || document.getElementById('setting-group-my-avatar-preview');
                       if (personaEl) personaEl.value = '';
                       if (avatarEl) avatarEl.src = 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg'; // 恢复默认头像
                   }
               });
           }

           if (personaModalClose) personaModalClose.addEventListener('click', function(){
               const modal = document.getElementById('mypersona-presets-modal');
               if (modal) {
                   modal.classList.remove('visible');
                   modal.style.display = 'none';
               }
           });

           // Global CSS Presets
           const globalCssModalClose = document.getElementById('global-css-close-modal');
           if (globalCssModalClose) globalCssModalClose.addEventListener('click', () => {
               const modal = document.getElementById('global-css-presets-modal');
               if (modal) {
                   modal.classList.remove('visible');
                   modal.style.display = 'none';
               }
           });
       }

        function setupWallpaperApp() {
            const e = document.getElementById('wallpaper-upload'), t = document.getElementById('wallpaper-preview');
            t.style.backgroundImage = `url(${db.wallpaper})`, t.textContent = '', e.addEventListener('change', async (a) => {
                const n = a.target.files[0];
                if (n) {
                    try {
                        const r = await compressImage(n, {quality: 0.85, maxWidth: 1080, maxHeight: 1920});
                        db.wallpaper = r, applyWallpaper(r), t.style.backgroundImage = `url(${r})`;
                        await saveData();
                        showToast('壁纸更换成功！');
                    } catch (s) {
                        showToast('壁纸压缩失败，请重试');
                    }
                }
            });
        }

        // --- GROUP CHAT FUNCTIONS ---
        function setupGroupChatSystem() {
            createGroupBtn.addEventListener('click', () => {
                renderMemberSelectionList();
                createGroupModal.classList.add('visible');
            });
            createGroupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const selectedMemberIds = Array.from(memberSelectionList.querySelectorAll('input:checked')).map(input => input.value);
                const groupName = groupNameInput.value.trim();
                if (selectedMemberIds.length < 1) return showToast('请至少选择一个群成员。');
                if (!groupName) return showToast('请输入群聊名称。');
                const firstChar = db.characters.length > 0 ? db.characters[0] : null;
                const newGroup = {
                    id: `group_${Date.now()}`,
                    name: groupName,
                    avatar: 'https://i.postimg.cc/fTLCngk1/image.jpg',
                    me: {
                        nickname: firstChar ? firstChar.myName : '我',
                        persona: firstChar ? firstChar.myPersona : '',
                        avatar: firstChar ? firstChar.myAvatar : 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg'
                    },
                    members: selectedMemberIds.map(charId => {
                        const char = db.characters.find(c => c.id === charId);
                        return {
                            id: `member_${char.id}`,
                            originalCharId: char.id,
                            realName: char.realName,
                            groupNickname: char.remarkName,
                            persona: char.persona,
                            avatar: char.avatar
                        };
                    }),
                    theme: 'white_pink',
                    maxMemory: 10,
                    chatBg: '',
                    history: [],
                    isPinned: false,
                    unreadCount: 0,
                    useCustomBubbleCss: false,
                    customBubbleCss: '',
                    worldBookIds: []
                };
                db.groups.push(newGroup);
                await saveData();
                renderChatList();
                createGroupModal.classList.remove('visible');
                showToast(`群聊“${groupName}”创建成功！`);
            });
            groupSettingsForm.addEventListener('submit', e => {
                e.preventDefault();
                saveGroupSettingsFromSidebar();
                groupSettingsSidebar.classList.remove('open');
            });
            const useGroupCustomCssCheckbox = document.getElementById('setting-group-use-custom-css'),
                groupCustomCssTextarea = document.getElementById('setting-group-custom-bubble-css'),
                resetGroupCustomCssBtn = document.getElementById('reset-group-custom-bubble-css-btn'),
                groupPreviewBox = document.getElementById('group-bubble-css-preview');
            useGroupCustomCssCheckbox.addEventListener('change', (e) => {
                groupCustomCssTextarea.disabled = !e.target.checked;
                const group = db.groups.find(g => g.id === currentChatId);
                if (group) {
                    // [修改] 从下拉框实时获取主题，而不是从数据库
                    const themeKey = document.getElementById('setting-group-theme-color').value || 'white_pink';
                    const theme = colorThemes[themeKey];

                    if (e.target.checked) {
                        // 如果勾选，预览输入框的内容
                        updateBubbleCssPreview(groupPreviewBox, groupCustomCssTextarea.value, false, theme);
                    } else {
                        // 如果取消勾选，预览当前选择的主题
                        updateBubbleCssPreview(groupPreviewBox, '', true, theme);
                    }
                }
            });
            groupCustomCssTextarea.addEventListener('input', (e) => {
                const group = db.groups.find(g => g.id === currentChatId);
                if (group && useGroupCustomCssCheckbox.checked) {
                    const theme = colorThemes[group.theme || 'white_pink'];
                    updateBubbleCssPreview(groupPreviewBox, e.target.value, false, theme);
                }
            });
            resetGroupCustomCssBtn.addEventListener('click', () => {
                const group = db.groups.find(g => g.id === currentChatId);
                if (group) {
                    groupCustomCssTextarea.value = '';
                    useGroupCustomCssCheckbox.checked = false;
                    groupCustomCssTextarea.disabled = true;
                    const theme = colorThemes[group.theme || 'white_pink'];
                    updateBubbleCssPreview(groupPreviewBox, '', true, theme);
                    showToast('样式已重置为默认');
                }
            });
            document.getElementById('setting-group-avatar-upload').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const compressedUrl = await compressImage(file, {quality: 0.8, maxWidth: 400, maxHeight: 400});
                        const group = db.groups.find(g => g.id === currentChatId);
                        if (group) {
                            group.avatar = compressedUrl;
                            document.getElementById('setting-group-avatar-preview').src = compressedUrl;
                        }
                    } catch (error) {
                        showToast('群头像压缩失败，请重试');
                    }
                }
            });
            document.getElementById('setting-group-chat-bg-upload').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const compressedUrl = await compressImage(file, {
                            quality: 0.85,
                            maxWidth: 1080,
                            maxHeight: 1920
                        });
                        const group = db.groups.find(g => g.id === currentChatId);
                        if (group) {
                            group.chatBg = compressedUrl;
                            chatRoomScreen.style.backgroundImage = `url(${compressedUrl})`;
                            await saveData();
                            showToast('聊天背景已更换');
                        }
                    } catch (error) {
                        showToast('群聊背景压缩失败，请重试');
                    }
                }
            });
            document.getElementById('clear-group-chat-history-btn').addEventListener('click', async () => {
                const group = db.groups.find(g => g.id === currentChatId);
                if (!group) return;
                if (confirm(`你确定要清空群聊“${group.name}”的所有聊天记录吗？这个操作是不可恢复的！`)) {
                    group.history = [];
                    await saveData();
                    renderMessages(false, true);
                    renderChatList();
                    groupSettingsSidebar.classList.remove('open');
                    showToast('聊天记录已清空');
                }
            });
            groupMembersListContainer.addEventListener('click', e => {
                const memberDiv = e.target.closest('.group-member');
                const addBtn = e.target.closest('.add-member-btn');
                if (memberDiv) {
                    openGroupMemberEditModal(memberDiv.dataset.id);
                } else if (addBtn) {
                    addMemberActionSheet.classList.add('visible');
                }
            });
            document.getElementById('edit-member-avatar-preview').addEventListener('click', () => {
                document.getElementById('edit-member-avatar-upload').click();
            });
            document.getElementById('edit-member-avatar-upload').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const compressedUrl = await compressImage(file, {quality: 0.8, maxWidth: 400, maxHeight: 400});
                        document.getElementById('edit-member-avatar-preview').src = compressedUrl;
                    } catch (error) {
                        showToast('成员头像压缩失败，请重试');
                    }
                }
            });
            editGroupMemberForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const memberId = document.getElementById('editing-member-id').value;
                const group = db.groups.find(g => g.id === currentChatId);
                const member = group.members.find(m => m.id === memberId);
                if (member) {
                    member.avatar = document.getElementById('edit-member-avatar-preview').src;
                    member.groupNickname = document.getElementById('edit-member-group-nickname').value;
                    member.realName = document.getElementById('edit-member-real-name').value;
                    member.persona = document.getElementById('edit-member-persona').value;
                    await saveData();
                    renderGroupMembersInSettings(group);
                    document.querySelectorAll(`.message-wrapper[data-sender-id="${member.id}"] .group-nickname`).forEach(el => {
                        el.textContent = member.groupNickname;
                    });
                    showToast('成员信息已更新');
                }
                editGroupMemberModal.classList.remove('visible');
            });
            inviteExistingMemberBtn.addEventListener('click', () => {
                renderInviteSelectionList();
                inviteMemberModal.classList.add('visible');
                addMemberActionSheet.classList.remove('visible');
            });
            createNewMemberBtn.addEventListener('click', () => {
                createMemberForGroupForm.reset();
                document.getElementById('create-group-member-avatar-preview').src = 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg';
                createMemberForGroupModal.classList.add('visible');
                addMemberActionSheet.classList.remove('visible');
            });
            document.getElementById('create-group-member-avatar-preview').addEventListener('click', () => {
                document.getElementById('create-group-member-avatar-upload').click();
            });
            document.getElementById('create-group-member-avatar-upload').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const compressedUrl = await compressImage(file, {quality: 0.8, maxWidth: 400, maxHeight: 400});
                        document.getElementById('create-group-member-avatar-preview').src = compressedUrl;
                    } catch (error) {
                        showToast('新成员头像压缩失败，请重试');
                    }
                }
            });
            confirmInviteBtn.addEventListener('click', async () => {
                const group = db.groups.find(g => g.id === currentChatId);
                if (!group) return;
                const selectedCharIds = Array.from(inviteMemberSelectionList.querySelectorAll('input:checked')).map(input => input.value);
                selectedCharIds.forEach(charId => {
                    const char = db.characters.find(c => c.id === charId);
                    if (char) {
                        const newMember = {
                            id: `member_${char.id}`,
                            originalCharId: char.id,
                            realName: char.realName,
                            groupNickname: char.remarkName,
                            persona: char.persona,
                            avatar: char.avatar
                        };
                        group.members.push(newMember);
                        sendInviteNotification(group, newMember.realName);
                    }
                });
                if (selectedCharIds.length > 0) {
                    await saveData();
                    renderGroupMembersInSettings(group);
                    renderMessages(false, true);
                    showToast('已邀请新成员');
                }
                inviteMemberModal.classList.remove('visible');
            });
            createMemberForGroupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const group = db.groups.find(g => g.id === currentChatId);
                if (!group) return;
                const newMember = {
                    id: `member_group_only_${Date.now()}`,
                    originalCharId: null,
                    realName: document.getElementById('create-group-member-realname').value,
                    groupNickname: document.getElementById('create-group-member-nickname').value,
                    persona: document.getElementById('create-group-member-persona').value,
                    avatar: document.getElementById('create-group-member-avatar-preview').src,
                };
                group.members.push(newMember);
                sendInviteNotification(group, newMember.realName);
                await saveData();
                renderGroupMembersInSettings(group);
                renderMessages(false, true);
                showToast(`新成员 ${newMember.groupNickname} 已加入`);
                createMemberForGroupModal.classList.remove('visible');
            });
            document.getElementById('setting-group-my-avatar-upload').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const compressedUrl = await compressImage(file, {quality: 0.8, maxWidth: 400, maxHeight: 400});
                        document.getElementById('setting-group-my-avatar-preview').src = compressedUrl;
                    } catch (error) {
                        showToast('头像压缩失败')
                    }
                }
            });
            confirmGroupRecipientBtn.addEventListener('click', () => {
                const selectedRecipientIds = Array.from(groupRecipientSelectionList.querySelectorAll('input:checked')).map(input => input.value);
                if (selectedRecipientIds.length === 0) {
                    return showToast('请至少选择一个收件人。');
                }
                currentGroupAction.recipients = selectedRecipientIds;
                groupRecipientSelectionModal.classList.remove('visible');

                if (currentGroupAction.type === 'transfer') {
                    sendTransferForm.reset();
                    sendTransferModal.classList.add('visible');
                } else if (currentGroupAction.type === 'gift') {
                    sendGiftForm.reset();
                    sendGiftModal.classList.add('visible');
                }
            });
            linkGroupWorldBookBtn.addEventListener('click', () => {
                const group = db.groups.find(g => g.id === currentChatId);
                if (!group) return;
                renderCategorizedWorldBookList(worldBookSelectionList, db.worldBooks, group.worldBookIds || [], 'wb-select-group');
                worldBookSelectionModal.classList.add('visible');
            });

            // ▼▼▼ 新增：绑定"NAI 模块手册"按钮 (群聊) ▼▼▼
            const openGroupNaiManagerBtn = document.getElementById('open-group-nai-module-manager-btn');
            if (openGroupNaiManagerBtn) {
                openGroupNaiManagerBtn.addEventListener('click', () => {
                    openNaiModuleManageModal();
                });
            }
            // ▲▲▲ 新增结束 ▲▲▲
        }

        function renderMemberSelectionList() {
            memberSelectionList.innerHTML = '';
            if (db.characters.length === 0) {
                memberSelectionList.innerHTML = '<li style="color:#aaa; text-align:center; padding: 10px 0;">没有可选择的人设。</li>';
                return;
            }
            db.characters.forEach(char => {
                const li = document.createElement('li');
                li.className = 'member-selection-item';
                li.innerHTML = `<input type="checkbox" id="select-${char.id}" value="${char.id}"><img src="${char.avatar}" alt="${char.remarkName}"><label for="select-${char.id}">${char.remarkName}</label>`;
                memberSelectionList.appendChild(li);
            });
        }

        function loadGroupSettingsToSidebar() {
            const group = db.groups.find(g => g.id === currentChatId);
            if (!group) return;
            const themeSelect = document.getElementById('setting-group-theme-color');
            if (themeSelect.options.length === 0) {
                Object.keys(colorThemes).forEach(key => {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = colorThemes[key].name;
                    themeSelect.appendChild(option);
                });
            }
            document.getElementById('setting-group-avatar-preview').src = group.avatar;
            document.getElementById('setting-group-name').value = group.name;
            document.getElementById('setting-group-my-avatar-preview').src = group.me.avatar;
            document.getElementById('setting-group-my-nickname').value = group.me.nickname;
            document.getElementById('setting-group-my-persona').value = group.me.persona;
            themeSelect.value = group.theme || 'white_pink';
            document.getElementById('setting-group-max-memory').value = group.maxMemory;
            renderGroupMembersInSettings(group);
            const useGroupCustomCssCheckbox = document.getElementById('setting-group-use-custom-css'),
                groupCustomCssTextarea = document.getElementById('setting-group-custom-bubble-css'),
                groupPreviewBox = document.getElementById('group-bubble-css-preview');
            useGroupCustomCssCheckbox.checked = group.useCustomBubbleCss || false;
            groupCustomCssTextarea.value = group.customBubbleCss || '';
            groupCustomCssTextarea.disabled = !useGroupCustomCssCheckbox.checked;
            const theme = colorThemes[group.theme || 'white_pink'];
            updateBubbleCssPreview(groupPreviewBox, group.customBubbleCss, !group.useCustomBubbleCss, theme);
            populateBubblePresetSelect('group-bubble-preset-select');

            // [新增] 为群聊"主题颜色"下拉框添加 change 事件监听
            const groupThemeSelect = document.getElementById('setting-group-theme-color');
            if (groupThemeSelect) {
                groupThemeSelect.addEventListener('change', () => {
                    const useCustomCss = document.getElementById('setting-group-use-custom-css').checked;
                    // 只有在"未勾选"自定义CSS时，才允许主题颜色更新预览
                    if (!useCustomCss) {
                        const theme = colorThemes[groupThemeSelect.value] || colorThemes['white_pink'];
                        const previewBox = document.getElementById('group-bubble-css-preview');
                        updateBubbleCssPreview(previewBox, '', true, theme);
                    }
                });
            }
        }

        function renderGroupMembersInSettings(group) {
            groupMembersListContainer.innerHTML = '';
            group.members.forEach(member => {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'group-member';
                memberDiv.dataset.id = member.id;
                memberDiv.innerHTML = `<img src="${member.avatar}" alt="${member.groupNickname}"><span>${member.groupNickname}</span>`;
                groupMembersListContainer.appendChild(memberDiv);
            });
            const addBtn = document.createElement('div');
            addBtn.className = 'add-member-btn';
            addBtn.innerHTML = `<div class="add-icon">+</div><span>添加</span>`;
            groupMembersListContainer.appendChild(addBtn);
        }

        function renderGroupRecipientSelectionList(actionText) {
            const group = db.groups.find(g => g.id === currentChatId);
            if (!group) return;
            groupRecipientSelectionTitle.textContent = actionText;
            groupRecipientSelectionList.innerHTML = '';
            group.members.forEach(member => {
                const li = document.createElement('li');
                li.className = 'group-recipient-select-item';
                li.innerHTML = `
                        <input type="checkbox" id="recipient-select-${member.id}" value="${member.id}">
                        <label for="recipient-select-${member.id}">
                            <img src="${member.avatar}" alt="${member.groupNickname}">
                            <span>${member.groupNickname}</span>
                        </label>`;
                groupRecipientSelectionList.appendChild(li);
            });
        }

        async function saveGroupSettingsFromSidebar() {
            const group = db.groups.find(g => g.id === currentChatId);
            if (!group) return;
            const oldName = group.name;
            const newName = document.getElementById('setting-group-name').value;
            if (oldName !== newName) {
                group.name = newName;
                sendRenameNotification(group, newName);
            }
            group.avatar = document.getElementById('setting-group-avatar-preview').src;
            group.me.avatar = document.getElementById('setting-group-my-avatar-preview').src;
            group.me.nickname = document.getElementById('setting-group-my-nickname').value;
            group.me.persona = document.getElementById('setting-group-my-persona').value;
            group.theme = document.getElementById('setting-group-theme-color').value;
            group.maxMemory = document.getElementById('setting-group-max-memory').value;
            group.useCustomBubbleCss = document.getElementById('setting-group-use-custom-css').checked;
            group.customBubbleCss = document.getElementById('setting-group-custom-bubble-css').value;
            updateCustomBubbleStyle(currentChatId, group.customBubbleCss, group.useCustomBubbleCss);
            await saveData();
            showToast('群聊设置已保存！');
            chatRoomTitle.textContent = group.name;
            renderChatList();
            renderMessages(false, true);
        }

        function openGroupMemberEditModal(memberId) {
            const group = db.groups.find(g => g.id === currentChatId);
            const member = group.members.find(m => m.id === memberId);
            if (!member) return;
            document.getElementById('edit-group-member-title').textContent = `编辑 ${member.groupNickname}`;
            document.getElementById('editing-member-id').value = member.id;
            document.getElementById('edit-member-avatar-preview').src = member.avatar;
            document.getElementById('edit-member-group-nickname').value = member.groupNickname;
            document.getElementById('edit-member-real-name').value = member.realName;
            document.getElementById('edit-member-persona').value = member.persona;
            editGroupMemberModal.classList.add('visible');
        }

        function renderInviteSelectionList() {
            inviteMemberSelectionList.innerHTML = '';
            const group = db.groups.find(g => g.id === currentChatId);
            if (!group) return;
            const currentMemberCharIds = new Set(group.members.map(m => m.originalCharId));
            const availableChars = db.characters.filter(c => !currentMemberCharIds.has(c.id));
            if (availableChars.length === 0) {
                inviteMemberSelectionList.innerHTML = '<li style="color:#aaa; text-align:center; padding: 10px 0;">没有可邀请的新成员了。</li>';
                confirmInviteBtn.disabled = true;
                return;
            }
            confirmInviteBtn.disabled = false;
            availableChars.forEach(char => {
                const li = document.createElement('li');
                li.className = 'invite-member-select-item';
                li.innerHTML = `<input type="checkbox" id="invite-select-${char.id}" value="${char.id}"><label for="invite-select-${char.id}"><img src="${char.avatar}" alt="${char.remarkName}"><span>${char.remarkName}</span></label>`;
                inviteMemberSelectionList.appendChild(li);
            });
        }

        function sendInviteNotification(group, newMemberRealName) {
            const messageContent = `[${group.me.nickname}邀请${newMemberRealName}加入了群聊]`;
            const message = {
                id: `msg_${Date.now()}`,
                role: 'user',
                content: messageContent,
                parts: [{type: 'text', text: messageContent}],
                timestamp: Date.now(),
                senderId: 'user_me'
            };
            group.history.push(message);
        }

        function sendRenameNotification(group, newName) {
            const myName = group.me.nickname;
            const messageContent = `[${myName}修改群名为：${newName}]`;
            const message = {
                id: `msg_${Date.now()}`,
                role: 'user',
                content: messageContent,
                parts: [{type: 'text', text: messageContent}],
                timestamp: Date.now()
            };
            group.history.push(message);
        }



        // 创建完整的备份数据
        async function createFullBackupData() {
            // The db object is already in memory, so we just need to clone it.
            // A deep clone is necessary to avoid any potential mutation issues.
            const backupData = JSON.parse(JSON.stringify(db));
            
            // Add export metadata
            backupData._exportVersion = '3.0'; // New version that uses multi-table Dexie
            backupData._exportTimestamp = Date.now();

            return backupData;
        }

        // 导入备份数据
        async function importBackupData(data) {
            const startTime = Date.now();
            try {
                // 1. Clear all existing data using the new storage system
                await Promise.all([
                    dexieDB.characters.clear(),
                    dexieDB.groups.clear(),
                    dexieDB.worldBooks.clear(),
                    dexieDB.myStickers.clear(),
                    dexieDB.globalSettings.clear()
                ]);
                showToast('正在清空旧数据...');

                let convertedData = data;

                // 2. Perform version check and compatibility conversion (this logic is good)
                if (data._exportVersion !== '3.0') {
                    showToast('检测到旧版备份文件，正在转换格式...');
                    
                    const reassembleHistory = (chat, backupData) => {
                        if (!chat.history || !Array.isArray(chat.history) || chat.history.length === 0) {
                            return [];
                        }
                        // If the first item is an object, it's a full history array.
                        if (typeof chat.history[0] === 'object' && chat.history[0] !== null) {
                            return chat.history;
                        }
                        // This part handles a very old chunked format, good to keep for compatibility.
                        if (backupData.__chunks__ && typeof chat.history[0] === 'string') {
                            let fullHistory = [];
                            chat.history.forEach(key => {
                                if (backupData.__chunks__[key]) {
                                    try {
                                        const chunk = JSON.parse(backupData.__chunks__[key]);
                                        fullHistory = fullHistory.concat(chunk);
                                    } catch (e) {
                                        console.error(`Failed to parse history chunk ${key}`, e);
                                    }
                                }
                            });
                            return fullHistory;
                        }
                        return []; // Unrecognized format
                    };

                    const newData = { ...data };

                    if (newData.characters) {
                        newData.characters = newData.characters.map(char => ({
                            ...char,
                            history: reassembleHistory(char, data)
                        }));
                    }
                    if (newData.groups) {
                        newData.groups = newData.groups.map(group => ({
                            ...group,
                            history: reassembleHistory(group, data)
                        }));
                    }
                    
                    convertedData = newData;
                }

                // 3. Overwrite the in-memory db object with the imported data
                Object.keys(db).forEach(key => {
                    if (convertedData[key] !== undefined) {
                        db[key] = convertedData[key];
                    }
                });
                // Ensure new properties exist if they were not in the backup
                if (!db.pomodoroTasks) db.pomodoroTasks = [];
                if (!db.pomodoroSettings) db.pomodoroSettings = { boundCharId: null, userPersona: '', focusBackground: '', taskCardBackground: '', encouragementMinutes: 25, pokeLimit: 5, globalWorldBookIds: [] };
                if (!db.insWidgetSettings) db.insWidgetSettings = { avatar1: 'https://i.postimg.cc/Y96LPskq/o-o-2.jpg', bubble1: 'love u.', avatar2: 'https://i.postimg.cc/GtbTnxhP/o-o-1.jpg', bubble2: 'miss u.' };
                if (!db.homeWidgetSettings) db.homeWidgetSettings = JSON.parse(JSON.stringify(defaultWidgetSettings));
                // ▼▼▼ 新增 ▼▼▼
                if (!db.naiPromptModules) db.naiPromptModules = [];
                if (!db.naiGlobalPromptPresets) db.naiGlobalPromptPresets = [];
                // ▲▲▲ 新增结束 ▲▲▲


                // 4. Call the new saveData function which handles the new DB schema
                showToast('正在写入新数据...');
                await saveData();

                const duration = Date.now() - startTime;
                const message = `导入完成 (耗时${duration}ms)`;
                
                return { success: true, message: message };

            } catch (error) {
                console.error('导入数据失败:', error);
                return {
                    success: false,
                    error: error.message,
                    duration: Date.now() - startTime
                };
            }
        }
        
                function setupForumBindingFeature() {
            const forumLinkBtn = document.getElementById('forum-link-btn');
            const modal = document.getElementById('forum-binding-modal');
            const tabs = modal.querySelectorAll('.tab-btn');
            const contentPanes = modal.querySelectorAll('.forum-binding-content');
            const confirmBtn = document.getElementById('confirm-forum-binding-btn');

            // 1. 打开弹窗的事件监听
            forumLinkBtn.addEventListener('click', () => {
                openForumBindingModal();
            });

            // 2. 弹窗内的标签页切换逻辑
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // 移除所有标签和内容的 active 状态
                    tabs.forEach(t => t.classList.remove('active'));
                    contentPanes.forEach(p => p.classList.remove('active'));

                    // 为点击的标签和对应内容添加 active 状态
                    tab.classList.add('active');
                    const targetId = tab.dataset.target;
                    document.getElementById(targetId).classList.add('active');
                });
            });

            // 3. 确认绑定按钮的事件监听
            confirmBtn.addEventListener('click', async () => {
                const worldBookList = document.getElementById('forum-worldbook-list');
                const charList = document.getElementById('forum-char-list');
                const userList = document.getElementById('forum-user-list');

                // 收集所有选中的ID
                const selectedWorldBookIds = Array.from(worldBookList.querySelectorAll('.item-checkbox:checked')).map(input => input.value);
                const selectedCharIds = Array.from(charList.querySelectorAll('input:checked')).map(input => input.value);
                const selectedUserPersonaIds = Array.from(userList.querySelectorAll('input:checked')).map(input => input.value);

                // 保存到db对象
                db.forumBindings = {
                    worldBookIds: selectedWorldBookIds,
                    charIds: selectedCharIds,
                    userPersonaIds: selectedUserPersonaIds,
                };

                await saveData();
                showToast('论坛绑定已更新');
                modal.classList.remove('visible');
            });

            function openForumBindingModal() {
                const worldBookList = document.getElementById('forum-worldbook-list');
                const charList = document.getElementById('forum-char-list');
                const userList = document.getElementById('forum-user-list');

                // 清空旧内容
                worldBookList.innerHTML = '';
                charList.innerHTML = '';
                userList.innerHTML = '';

                const currentBindings = db.forumBindings || { worldBookIds: [], charIds: [], userPersonaIds: [] };

                // 填充世界书列表
                renderCategorizedWorldBookList(worldBookList, db.worldBooks, currentBindings.worldBookIds, 'wb-bind');

                // 填充Char列表
                if (db.characters.length > 0) {
                    db.characters.forEach(char => {
                        const isChecked = currentBindings.charIds.includes(char.id);
                        const li = document.createElement('li');
                        li.className = 'binding-list-item';
                        li.innerHTML = `
                            <input type="checkbox" id="char-bind-${char.id}" value="${char.id}" ${isChecked ? 'checked' : ''}>
                            <label for="char-bind-${char.id}">${char.remarkName}</label>
                        `;
                        charList.appendChild(li);
                    });
                } else {
                    charList.innerHTML = '<li>暂无Char设定</li>';
                }

                // 填充User人设列表
                if (db.myPersonaPresets.length > 0) {
                    db.myPersonaPresets.forEach(preset => {
                        // user人设的ID就是它的name
                        const isChecked = currentBindings.userPersonaIds.includes(preset.name);
                        const li = document.createElement('li');
                        li.className = 'binding-list-item';
                        li.innerHTML = `
                            <input type="checkbox" id="user-bind-${preset.name.replace(/\s/g, '_')}" value="${preset.name}" ${isChecked ? 'checked' : ''}>
                            <label for="user-bind-${preset.name.replace(/\s/g, '_')}">${preset.name}</label>
                        `;
                        userList.appendChild(li);
                    });
                } else {
                    userList.innerHTML = '<li>暂无User人设预设</li>';
                }

                // 重置标签页到第一个
                tabs.forEach((tab, index) => {
                    tab.classList.toggle('active', index === 0);
                });
                contentPanes.forEach((pane, index) => {
                    pane.classList.toggle('active', index === 0);
                });


                // 显示弹窗
                modal.classList.add('visible');
            }
        }

// 在 setupForumFeature 函数的下面，新增这个函数
// 请用这个新版本完整替换旧的 renderPostDetail 函数
function renderPostDetail(post) {
    const detailScreen = document.getElementById('forum-post-detail-screen');
    if (!detailScreen || !post) return;

    // 为评论区的NPC生成随机头像颜色
    const npcColors = ["#FFB6C1", "#87CEFA", "#98FB98", "#F0E68C", "#DDA0DD", "#FFDAB9", "#B0E0E6"];
    const getRandomColor = () => npcColors[Math.floor(Math.random() * npcColors.length)];

    // --- 评论HTML生成 ---
    let commentsHtml = '';
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(comment => {
            const firstChar = comment.username.charAt(0).toUpperCase();
            commentsHtml += `
              <li class="comment-item">
                  <div class="comment-author-avatar" style="background-color: ${getRandomColor()}">${firstChar}</div>
                  <div class="comment-body">
                      <div class="comment-author-name">${comment.username}</div>
                      <div class="comment-content">${comment.content.replace(/\n/g, '<br>')}</div>
                      <div class="comment-timestamp">${comment.timestamp}</div>
                  </div>
              </li>
            `;
        });
    }

    // --- 整体页面HTML结构 ---
    const authorFirstChar = post.username.charAt(0).toUpperCase();
    detailScreen.innerHTML = `
    <header class="app-header">
        <button class="back-btn" data-target="forum-screen">‹</button>
        <div class="title-container">
            <h1 class="title">帖子详情</h1>
        </div>
        <button class="action-btn" id="header-share-btn" title="分享">
             <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L16.04,7.15C16.56,7.62 17.24,7.92 18,7.92C19.66,7.92 21,6.58 21,5C21,3.42 19.66,2 18,2C16.34,2 15,3.42 15,5C15,5.24 15.04,5.47 15.09,5.7L7.96,9.85C7.44,9.38 6.76,9.08 6,9.08C4.34,9.08 3,10.42 3,12C3,13.58 4.34,14.92 6,14.92C6.76,14.92 7.44,14.62 7.96,14.15L15.09,18.3C15.04,18.53 15,18.76 15,19C15,20.58 16.34,22 18,22C19.66,22 21,20.58 21,19C21,17.42 19.66,16.08 18,16.08Z"></path></svg>
        </button>
    </header>
    <main class="content">
        <div class="post-detail-container">
            <div class="post-detail-main">
                <div class="post-author-info">
                    <div class="author-avatar">${authorFirstChar}</div>
                    <div class="author-details">
                        <span class="author-name">${post.username}</span>
                        <span class="post-meta-data">${new Date(post.id.split('_')[1] * 1).toLocaleString()}</span>
                    </div>
                </div>
                <h2 class="post-detail-title">${post.title}</h2>
                <div class="post-detail-content-body">${post.content.replace(/\n/g, '<br>')}</div>
                <div class="post-detail-actions">
                    <div class="action-item">
                        <svg viewBox="0 0 24 24"><path d="M20,8H4V6H20V8M18,10H6V12H18V10M16,14H8V16H16V14M22,4V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V4A2,2 0 0,1 4,2H20A2,2 0 0,1 22,4Z" /></svg>
                        <span>${post.comments ? post.comments.length : 0}</span>
                    </div>
                    <div class="action-item">
                        <svg viewBox="0 0 24 24"><path d="M12.1,18.55L12,18.65L11.89,18.55C7.14,14.24 4,11.39 4,8.5C4,6.5 5.5,5 7.5,5C9.04,5 10.54,6 11.07,7.35H12.93C13.46,6 14.96,5 16.5,5C18.5,5 20,6.5 20,8.5C20,11.39 16.86,14.24 12.1,18.55M16.5,3C14.76,3 13.09,3.81 12,5.08C10.91,3.81 9.24,3 7.5,3C4.42,3 2,5.41 2,8.5C2,12.27 5.4,15.36 10.55,20.03L12,21.35L13.45,20.03C18.6,15.36 22,12.27 22,8.5C22,5.41 19.58,3 16.5,3Z" /></svg>
                        <span>${post.likeCount}</span>
                    </div>
                    <div class="action-item">
                        <svg viewBox="0 0 24 24"><path d="M13,9H18.5L13,3.5V9M6,2H14L20,8V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V4C4,2.89 4.89,2 6,2M15,18V16H6V18H15M18,14V12H6V14H18Z" /></svg>
                         <span>收藏</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="comments-section">
            <div class="comments-header">全部评论 (${post.comments ? post.comments.length : 0})</div>
            <ul class="comment-list">
                ${commentsHtml}
            </ul>
        </div>
    </main>`;

    // --- 给新生成的分享按钮绑定事件 ---
    const shareBtn = detailScreen.querySelector('#header-share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            openSharePostModal(post.id);
        });
    }
}




function setupForumFeature() {
    const refreshBtn = document.getElementById('forum-refresh-btn');
    const postsContainer = document.getElementById('forum-posts-container');
    const forumScreen = document.getElementById('forum-screen');
    const detailScreen = document.getElementById('forum-post-detail-screen');

    // 1. 刷新按钮的点击事件 (不变)
    refreshBtn.addEventListener('click', () => {
        handleForumRefresh();
    });

    // 2. 帖子列表卡片的点击事件 (不变)
    if (postsContainer) {
        postsContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.forum-post-card[data-id]');
            if (card) {
                const postId = card.dataset.id;
                const post = db.forumPosts.find(p => p.id === postId);
                if (post) {
                    renderPostDetail(post);
                    switchScreen('forum-post-detail-screen');
                }
            }
        });
    }

    // 3. (修改) 监听详情页内部的点击事件，特别是右上角分享按钮
    if (detailScreen) {
        detailScreen.addEventListener('click', e => {
            // 监听新的分享按钮
            if (e.target.closest('#header-share-btn')) {
                const card = detailScreen.querySelector('.post-detail-card');
                const postId = card ? card.dataset.postId : null;
                if(postId) {
                    openSharePostModal(postId);
                }
            }
        });
    }

    // 4. 观察论坛屏幕的激活状态 (不变)
    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.attributeName === 'class') {
                const isActive = forumScreen.classList.contains('active');
                if (isActive) {
                    if (db.forumPosts && db.forumPosts.length > 0) {
                        renderForumPosts(db.forumPosts);
                    } else {
                        postsContainer.innerHTML = '<p class="placeholder-text" style="margin-top: 50px;">这里空空也...<br>点击右上角刷新按钮加载帖子吧！</p>';
                    }
                }
            }
        }
    });

    if (forumScreen) {
        observer.observe(forumScreen, { attributes: true });
    }
}

function setupShareModal() {
    const modal = document.getElementById('share-post-modal');
    const confirmBtn = document.getElementById('confirm-share-btn');
    const charList = document.getElementById('share-char-list');

    confirmBtn.addEventListener('click', async () => {
        const selectedCharIds = Array.from(charList.querySelectorAll('input:checked')).map(input => input.value);

        if (selectedCharIds.length === 0) {
            showToast('请至少选择一个分享对象。');
            return;
        }

        const postTitle = modal.dataset.postTitle;
        const postSummary = modal.dataset.postSummary;

        if (!postTitle || !postSummary) {
            showToast('无法获取帖子信息，分享失败。');
            return;
        }

        selectedCharIds.forEach(charId => {
            const character = db.characters.find(c => c.id === charId);
            if (character) {
                // 构建符合 AI 理解格式的文本消息
                const messageContent = `[论坛分享]标题：${postTitle}\n摘要：${postSummary}`;

                const message = {
                    id: `msg_${Date.now()}_${Math.random()}`,
                    role: 'user', // 作为用户发送的消息
                    content: messageContent,
                    parts: [{ type: 'text', text: messageContent }],
                    timestamp: Date.now()
                };

                character.history.push(message);
            }
        });

        await saveData();
        renderChatList(); // 刷新聊天列表以显示新消息预览
        modal.classList.remove('visible');
        showToast(`成功分享给 ${selectedCharIds.length} 位联系人！`);
    });
}

function openSharePostModal(postId) {
    const post = db.forumPosts.find(p => p.id === postId);
    if (!post) {
        showToast('找不到该帖子信息。');
        return;
    }

    const modal = document.getElementById('share-post-modal');
    const charList = document.getElementById('share-char-list');
    const detailsElement = modal.querySelector('details');

    // 将帖子信息存储在弹窗的 dataset 中
    modal.dataset.postTitle = post.title;
    modal.dataset.postSummary = post.summary;

    charList.innerHTML = ''; // 清空列表

    if (db.characters.length > 0) {
        db.characters.forEach(char => {
            const li = document.createElement('li');
            li.className = 'binding-list-item';
            li.innerHTML = `
                <input type="checkbox" id="share-to-${char.id}" value="${char.id}">
                <label for="share-to-${char.id}" style="display: flex; align-items: center; gap: 10px;">
                    <img src="${char.avatar}" alt="${char.remarkName}" style="width: 32px; height: 32px; border-radius: 50%;">
                    ${char.remarkName}
                </label>
            `;
            charList.appendChild(li);
        });
    } else {
        charList.innerHTML = '<li style="color: #888;">暂无可以分享的角色。</li>';
    }

    if(detailsElement) detailsElement.open = false;

    modal.classList.add('visible');
}


function getForumGenerationContext() {
    let context = "以下是论坛社区的背景设定和主要角色信息：\n\n";
    const bindings = db.forumBindings || { worldBookIds: [], charIds: [], userPersonaIds: [] };

    // 1. 添加世界观设定
    if (bindings.worldBookIds && bindings.worldBookIds.length > 0) {
        context += "===== 世界观设定 =====\n";
        bindings.worldBookIds.forEach(id => {
            const book = db.worldBooks.find(wb => wb.id === id);
            if (book) {
                context += `设定名: ${book.name}\n内容: ${book.content}\n\n`;
            }
        });
    }

    // 2. 添加角色人设
    if (bindings.charIds && bindings.charIds.length > 0) {
        context += "===== 主要角色人设 =====\n";
        bindings.charIds.forEach(id => {
            const char = db.characters.find(c => c.id === id);
            if (char) {
                context += `角色名: ${char.realName} (昵称: ${char.remarkName})\n人设: ${char.persona}\n\n`;
            }
        });
    }

    // 3. 添加用户人设
    if (bindings.userPersonaIds && bindings.userPersonaIds.length > 0) {
        context += "=====  (你) 的人设 =====\n";
        bindings.userPersonaIds.forEach(presetName => {
            const preset = db.myPersonaPresets.find(p => p.name === presetName);
            if (preset) {
                context += `人设名: ${preset.name}\n人设描述: ${preset.persona}\n\n`;
            }
        });
    }

    if (context.length < 50) { // 如果什么都没选
        return "没有提供任何特定的背景设定，请自由发挥，创作一些通用的、有趣有网感的论坛帖子。禁止以user或者char的视角制作帖子，发帖人只能是NPC";
    }

    return context;
}

async function handleForumRefresh() {
    const { url, key, model, provider } = db.apiSettings;
    if (!url || !key || !model) {
        showToast('请先在API设置中配置好接口信息');
        switchScreen('api-settings-screen');
        return;
    }
    const refreshBtn = document.getElementById('forum-refresh-btn');
    const postsContainer = document.getElementById('forum-posts-container');

    // 新增：获取搜索输入框的引用
    const searchInput = document.getElementById('forum-search-input');

    refreshBtn.disabled = true;
    const spinner = `<div class="spinner" style="display: block; margin: 0 auto; border-top-color: var(--primary-color);"></div>`;
    postsContainer.innerHTML = `<p class="placeholder-text" style="margin-top: 50px;">正在生成论坛内容，请稍候...<br>${spinner}</p>`;

    try {
        const context = getForumGenerationContext();

        // 新增：获取搜索关键词
        const keywords = searchInput.value.trim();

        let systemPrompt = `你是一位专业的论坛内容生成专家，专门为指定世界观生成论坛帖子。
背景信息如下：
${context}

你的任务是读取背景世界观生成6到8篇风格各异、内容有趣的论坛帖子，每条帖子下面生成4~8条评论，每个帖子评论数量应该不一样，注意区分真实姓名和网名，注意user隐私，你的角色是“世界构建者”和“社区模拟器”，你需要分析char设定和user人设所处世界的世界观而不是“角色扮演者”，发帖人应该是该角色所处世界观下的其他NPC，发帖人不能是user。ABSOLUTELY DO NOT。若角色为普通人或需保密等神秘身份就禁止提及角色真实姓名，可以用代称或者暗号，只有当user或者char是公众人物名气大时才可以提及真实姓名。char的备注或者昵称是仅供user使用的，NPC不知道也禁止提及char的备注。若user和char不在一个地区就禁止有NPC目睹二人同框。

请严格按照下面的JSON格式返回，不要包含任何多余的解释和注释，仅返回JSON内容本身。禁止以user的视角进行创作。

返回格式示例:
{
  "posts": [
    {
      "title": "一个引人注目的帖子标题",
      "summary": "对帖子内容的客观的重点摘要，大约100字左右，DO NOT use first-person “我”",
      "content": "帖子的详细内容，150~300字。\\n可以使用换行符来分段落，注意排版。",
      "comments": [
        {
          "username": "路人（随机姓名）",
          "content": "这是第一条评论的内容，表达一个观点。",
          "timestamp": "5分钟前"
        },
        {
          "username": "（随机姓名）",
          "content": "这是第二条评论，可能反驳楼主或楼上的观点。",
          "timestamp": "3分钟前"
        }
      ]
    }
  ]
}`;

        // 新增：如果关键词存在，就把它加到系统指令里
        if (keywords) {
            systemPrompt += `\n\n重要指令：本次生成的所有帖子标题必须和以下关键词相关：【${keywords}】，同时也需要和之前绑定的设定相关。禁止相似帖子过多，不要特地把关键词标注出来。`;
        }


        const requestBody = {
            model: model,
            messages: [{ role: "user", content: systemPrompt }],
            temperature: 0.8,
        };

        // (!!!) 修复：仅在非 Gemini 服务商时才添加 json_object
        if (provider !== 'gemini') {
            requestBody.response_format = { type: "json_object" };
        }

        const endpoint = `${url}/v1/chat/completions`;
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = new Error(`API 请求失败: ${response.status} ${await response.text()}`);
            error.response = response;
            throw error;
        }

        const result = await response.json();

        // --- 修复：同时处理 "TypeError" 和 "SyntaxError" ---

        // 1. [修复TypeError] 检查 AI 是否返回了有效的内容
        if (!result.choices || result.choices.length === 0 || !result.choices[0].message || !result.choices[0].message.content) {
            console.error("API Error: AI返回了空内容或错误结构", result);
            // 尝试从 result.error 中提取更详细的API错误信息
            const apiErrorMsg = result.error ? result.error.message : 'AI未返回有效内容';
            throw new Error(`API 返回无效: ${apiErrorMsg}`);
        }

        // 2. [修复SyntaxError] 提取并清理AI返回的原始文本
        let contentStr = result.choices[0].message.content;

        // 2a. 尝试查找 ```json ... ``` 标记
        const jsonMatch = contentStr.match(/```json([\s\S]*?)```/);

        if (jsonMatch && jsonMatch[1]) {
            // 2b. 如果找到了，就只用标记里的内容
            contentStr = jsonMatch[1].trim();
        } else {
            // 2c. 如果没找到(备用方案)，尝试粗暴地查找第一个 { 和最后一个 }
            //    这可以处理AI在JSON前后添加了 "好的：" 或 "当然：" 之类的污染词
            const firstBrace = contentStr.indexOf('{');
            const lastBrace = contentStr.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                contentStr = contentStr.substring(firstBrace, lastBrace + 1).trim();
            }
        }
        // --- 修复结束 ---

        const jsonData = JSON.parse(contentStr); // 3. 现在，我们解析的是被检查和清理过的 contentStr
        if (jsonData && Array.isArray(jsonData.posts)) {
            const enhancedPosts = jsonData.posts.map(post => ({
              ...post,
              id: `post_${Date.now()}_${Math.random()}`,
              username: `楼主${Math.floor(100 + Math.random() * 900)}`, // 随机楼主
              likeCount: Math.floor(Math.random() * 200),
              shareCount: Math.floor(Math.random() * 50),
              comments: post.comments || []
   
            }));

            db.forumPosts = enhancedPosts;
            await saveData();
            renderForumPosts(db.forumPosts);

        } else {
            throw new Error("AI返回的数据格式不正确");
        }

    } catch (error) {
        showApiError(error);
        postsContainer.innerHTML = `<p class="placeholder-text" style="margin-top: 50px;">生成失败了，请检查API设置或网络后重试。</p>`;
    } finally {
        refreshBtn.disabled = false;
    }
}


// 找到 renderForumPosts 函数，并用下面的代码替换它

function renderForumPosts(posts) {
    const postsContainer = document.getElementById('forum-posts-container');
    postsContainer.innerHTML = ''; // 清空旧内容

    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = '<p class="placeholder-text" style="margin-top: 50px;">AI还没生成任何帖子，请点击刷新按钮。';
        return;
    }

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'forum-post-card';

        // --- 这就是关键的修复 ---
        // 为每个帖子卡片添加 data-id 属性
        card.dataset.id = post.id;
        // -----------------------

        // 使用 textContent 防止XSS攻击
        const titleEl = document.createElement('h3');
        titleEl.className = 'post-title';
        titleEl.textContent = post.title || '无标题';

        const summaryEl = document.createElement('p');
        summaryEl.className = 'post-summary';
        summaryEl.textContent = post.summary || '无摘要';

        // 注意：这里不再需要 post-content 元素，因为它在新页面显示
        // const contentEl = document.createElement('div');
        // contentEl.className = 'post-content';
        // contentEl.textContent = post.content || '无内容';

        card.appendChild(titleEl);
        card.appendChild(summaryEl);
        // card.appendChild(contentEl); // 移除这一行

        postsContainer.appendChild(card);
    });
}



        init();

        // ========================================
        // 🖼️ NAI图片三击下载功能（非入侵式）
        // ========================================
        (function() {
            'use strict';

            function downloadImage(imageSrc, filename) {
                try {
                    const link = document.createElement('a');
                    link.href = imageSrc;
                    link.download = filename;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    setTimeout(() => { document.body.removeChild(link); }, 100);
                    console.log('✅ [NAI下载] 开始下载图片:', filename);
                    showToast('📥 图片下载中...');
                } catch (error) {
                    console.error('❌ [NAI下载] 下载失败:', error);
                    showToast('下载失败，请重试');
                }
            }

            function generateFilename(imgElement) {
                const title = imgElement.getAttribute('title') || imgElement.getAttribute('alt') || '';
                let cleanTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s]/g, '_').replace(/\s+/g, '_').substring(0, 30);
                if (!cleanTitle) cleanTitle = 'NAI_Image';
                const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
                return `${cleanTitle}_${timestamp}.png`;
            }

            let clickCount = 0;
            let clickTimer = null;
            let lastClickedElement = null;

            // 处理三击下载的通用函数
            function handleTripleClick(e) {
                const target = e.target;

                // 检查是否是 NAI 图片
                if (target.tagName === 'IMG' && target.classList.contains('naiimag-image')) {

                    if (target === lastClickedElement) {
                        clickCount++;
                    } else {
                        clickCount = 1;
                        lastClickedElement = target;
                    }

                    if (clickTimer) clearTimeout(clickTimer);

                    if (clickCount === 3) {
                        clickCount = 0;
                        lastClickedElement = null;
                        e.preventDefault();
                        e.stopPropagation();

                        console.log('🖼️ [NAI下载] 检测到三击NAI图片');
                        const imageSrc = target.src;

                        if (!imageSrc || imageSrc === 'about:blank' || imageSrc === '') {
                            showToast('图片加载中，请稍后重试');
                            return;
                        }
                        const filename = generateFilename(target);
                        downloadImage(imageSrc, filename);

                    } else {
                        clickTimer = setTimeout(() => {
                            clickCount = 0;
                            lastClickedElement = null;
                        }, 500); // 500ms 内三次点击
                    }
                }
            }

            // 使用事件委托，监听 document 上的点击（覆盖聊天消息和测试弹窗中的所有 NAI 图片）
            // 这样可以确保无论图片在哪里，都能被三击下载功能识别
            document.addEventListener('click', handleTripleClick, true); // 使用捕获阶段，提前拦截

            console.log('✅ [NAI下载] 三击下载功能已初始化（支持聊天消息和测试弹窗）');
        })();

        function renderPeekSteps(data) {
            const screen = document.getElementById('peek-steps-screen');
            const char = db.characters.find(c => c.id === currentChatId);
            if (!char) return; // 如果找不到角色，则不渲染

            const avatarEl = screen.querySelector('#steps-char-avatar');
            const nameEl = screen.querySelector('#steps-char-name');
            const currentStepsEl = screen.querySelector('#steps-current-count');
            const goalStepsEl = screen.querySelector('.steps-label');
            const progressRingEl = screen.querySelector('#steps-progress-ring');
            const trackListEl = screen.querySelector('#activity-track-list');
            const annotationEl = screen.querySelector('#steps-annotation-content');

            // 无论AI数据是否返回，都先渲染固定信息
            avatarEl.src = char.avatar;
            nameEl.textContent = char.realName;
            goalStepsEl.textContent = '/ 6000 步';

            if (!data) {
                // Display loading or empty state for dynamic content
                currentStepsEl.textContent = '----';
                trackListEl.innerHTML = '<li class="activity-track-item">正在生成活动轨迹...</li>';
                annotationEl.textContent = '正在生成角色批注...';
                progressRingEl.style.setProperty('--steps-percentage', 0);
                return;
            }

            // 填充AI返回的动态内容
            currentStepsEl.textContent = data.currentSteps;
            
            const percentage = (data.currentSteps / 6000) * 100;
            progressRingEl.style.setProperty('--steps-percentage', percentage);

            trackListEl.innerHTML = data.trajectory.map(item => `<li class="activity-track-item">${item}</li>`).join('');
            annotationEl.textContent = data.annotation;
        }

        function generatePeekContentPrompt(char, appType, mainChatContext) {
            const appNameMapping = {
                messages: "消息应用（模拟与他人的对话）",
                memos: "备忘录应用",
                cart: "电商平台的购物车",
                transfer: "文件传输助手（用于记录临时想法、链接等）",
                browser: "浏览器历史记录",
                drafts: "邮件或消息的草稿箱"
            };
            const appName = appNameMapping[appType] || appType;

            let prompt = `你正在模拟一个名为 ${char.realName} 的角色的手机内部信息。`;
            prompt += `该角色的核心人设是：${char.persona}。\n`;

            // 新增：获取并注入世界书和用户人设
            const associatedWorldBooks = (char.worldBookIds || []).map(id => db.worldBooks.find(wb => wb.id === id)).filter(Boolean);
            if (associatedWorldBooks.length > 0) {
                const worldBookContext = associatedWorldBooks.map(wb => `设定名: ${wb.name}\n内容: ${wb.content}`).join('\n\n');
                prompt += `\n为了更好地理解背景，请参考以下世界观设定：\n---\n${worldBookContext}\n---\n`;
            }
            if (char.myPersona) {
                prompt += `\n作为参考，我（用户）的人设是：${char.myPersona}\n`;
            }
            // 新增结束

            prompt += `最近，我（称呼为 ${char.myName}）和 ${char.realName} 的对话如下（这是你们关系和当前状态的核心参考）：\n---\n${mainChatContext}\n---\n`;
            prompt += `现在，我正在偷看Ta手机上的“${appName}”。请你基于Ta的人设和我们最近的聊天内容，生成符合该应用场景的、高度相关且富有沉浸感的内容。\n`;
            prompt += `你的输出必须是一个JSON对象，且只包含JSON内容，不要有任何额外的解释或标记。根据应用类型，JSON结构如下：\n`;

            switch (appType) {
                case 'messages':
                    prompt += `
                    {
                      "conversations": [
                        {
                          "partnerName": "与Ta对话的人的称呼",
                          "history": [
                            { "sender": "char", "content": "${char.realName}发送的消息内容" },
                            { "sender": "partner", "content": "对方发送的消息内容" }
                          ]
                        }
                      ]
                   }
                   请为 ${char.realName} 编造3-5个最近的对话。对话内容需要强烈反映Ta的人设以及和我的聊天上下文。`;
                    break;
                case 'steps':
                    prompt += `
                    {
                      "currentSteps": 8102,
                      "trajectory": [
                        "08:30 AM - 公司楼下咖啡馆",
                        "10:00 AM - 宠物用品店",
                        "12:00 PM - 附近日料店",
                        "03:00 PM - 回家路上的甜品店",
                        "04:00 PM - 楼下的便利店",
                        "06:30 PM - 健身房"
                      ],
                      "annotation": "角色对自己今天运动情况的批注"
                    }
                    请为 ${char.realName} 生成今天的步数信息。你只需要生成Ta的当前步数(currentSteps)，Ta的6条运动轨迹(trajectory)（禁止照搬示例）以及批注(annotation)。内容需要与Ta的人设和我们的聊天上下文高度相关。`;
                    break;
                case 'wallet':
prompt += `  { "transactions": [ {"type": "expense", "amount": 89.00, "description": "购买书籍", "peer": "线上书店", "status": "交易成功", "time": "今天 10:05"}, {"type": "income", "amount": 500.00, "description": "稿费收入", "peer": "XX出版社", "status": "已到账", "time": "昨天 15:20"}, {"type": "expense", "amount": 128.00, "description": "给${char.myName}挑选的生日礼物", "peer": "精品店", "status": "交易成功", "time": "三天前"} ] } 请为 ${char.realName} 生成一个包含5-8条的钱包账单列表 (transactions)。记录要符合Ta的人设和我们的聊天上下文。至少有一笔支出是关于我（${char.myName}）的。 `;
break;
                case 'album':
                    prompt += `
                    {
                      "photos": [
                        { "type": "photo", "imageDescription": "对一张照片的详细文字描述，例如：一张傍晚在海边的自拍，背景是橙色的晚霞和归来的渔船。", "description": "角色对这张照片的一句话批注，例如：那天的风很舒服。" },
                        { "type": "video", "imageDescription": "对一段视频的详细文字描述，例如：一段在猫咖撸猫的视频，视频里有一只橘猫在打哈欠。", "description": "角色对这段视频的一句话批注，例如：下次还来这里！" }
                      ]
                    }
                    请为 ${char.realName} 的相册生成5-8个条目（照片或视频）。内容需要与Ta的人设和我们的聊天上下文高度相关。'imageDescription' 是对这张照片/视频的详细文字描述，它将代替真实的图片展示给用户。'description' 是 ${char.realName} 自己对这张照片/视频的一句话批注，会显示在描述下方。`;
                    break;
                case 'memos':
                    prompt += `
                    {
                      "memos": [
                        { "id": "memo_1", "title": "备忘录标题", "content": "备忘录内容，可以包含换行符\\n" }
                      ]
                    }
                    请生成3-4条备忘录，内容要与Ta的人设和我们的聊天上下文相关。`;
                    break;
                case 'cart':
                    prompt += `
                    {
                      "items": [
                        { "id": "cart_1", "title": "商品标题", "spec": "商品规格", "price": "25.00" }
                      ]
                    }
                    请生成3-4件商品，这些商品应该反映Ta的兴趣、需求或我们最近聊到的话题。`;
                    break;
                case 'browser':
                    prompt += `
                    {
                      "history": [
                        { "title": "网页标题", "url": "example.com/path", "annotation": "角色对于这条浏览记录的想法或批注" }
                      ]
                    }
                    请生成3-5条浏览记录。记录本身要符合Ta的人设和我们的聊天上下文，'annotation'字段则要站在角色自己的视角，记录Ta对这条浏览记录的想法或批注。`;
                    break;
                case 'drafts':
                    prompt += `
                    {
                      "draft": { "to": "${char.myName}", "content": "一封写给我但未发送的草稿内容，可以使用HTML的<span class='strikethrough'></span>标签来表示划掉的文字。" }
                    }
                    请生成一份Ta写给我但犹豫未决、未发送的草稿。内容要深刻、细腻，反映Ta的内心挣扎和与我的关系。`;
                    break;
               case 'transfer':
                   prompt += `
                   {
                     "entries": [
                       "要记得买牛奶。",
                       "https://example.com/interesting-article",
                       "刚刚那个想法不错，可以深入一下..."
                     ]
                   }
                   请为 ${char.realName} 生成4-7条Ta发送给自己的、简短零碎的消息。这些内容应该像是Ta的临时备忘、灵感闪现或随手保存的链接，要与Ta的人设和我们的聊天上下文相关，但比“备忘录”应用的内容更随意、更口语化。`;
                   break;
                default:
                    prompt += `{"error": "Unknown app type"}`;
                    break;
                case 'unlock':
                    prompt += `
                    {
                      "nickname": "角色的微博昵称",
                      "handle": "@角色的微博ID",
                      "bio": "角色的个性签名，可以包含换行符\\n",
                      "posts": [
                        { "timestamp": "2小时前", "content": "第一条微博正文内容，140字以内。" },
                        { "timestamp": "昨天", "content": "第二条微博正文内容。" },
                        { "timestamp": "3天前", "content": "第三条微博正文内容。" }
                      ]
                    }
                    请为 ${char.realName} 生成一个符合其人设的微博小号。你需要生成昵称、ID、个性签名，以及3-4条最近的微博。微博内容要生活化、碎片化，符合小号的风格，并与Ta的人设和我们的聊天上下文高度相关。`;
                    break;
            }
            return prompt;
        }

        async function generateAndRenderPeekContent(appType, options = {}) {
            const { forceRefresh = false } = options;

            if (generatingPeekApps.has(appType)) {
                showToast('该应用内容正在生成中，请稍候...');
                return;
            }

            // Check cache first
            if (!forceRefresh && peekContentCache[appType]) {
                const cachedData = peekContentCache[appType];
                switch (appType) {
                    case 'messages':
                        renderPeekChatList(cachedData.conversations);
                        switchScreen('peek-messages-screen');
                        break;
                    case 'album':
                        renderPeekAlbum(cachedData.photos);
                        switchScreen('peek-album-screen');
                        break;
                    case 'memos':
                        renderMemosList(cachedData.memos);
                        switchScreen('peek-memos-screen');
                        break;
                    case 'album':
                        renderPeekAlbum(cachedData.photos);
                        switchScreen('peek-album-screen');
                        break;
                   case 'transfer':
                       renderPeekTransferStation(cachedData.entries);
                       switchScreen('peek-transfer-station-screen');
                       break;
                    case 'cart':
                        renderPeekCart(cachedData.items);
                        switchScreen('peek-cart-screen');
                        break;
                    case 'browser':
                        renderPeekBrowser(cachedData.history);
                        switchScreen('peek-browser-screen');
                        break;
                    case 'drafts':
                        renderPeekDrafts(cachedData.draft);
                        switchScreen('peek-drafts-screen');
                        break;
                   case 'steps':
                      renderPeekSteps(cachedData);
                      switchScreen('peek-steps-screen');
                      break;
                case 'wallet':
// 缓存逻辑：隐藏占位符，显示列表
document.getElementById('ai-wallet-transactions-title').textContent = `${peekContentCache[appType].charName || 'Ta'}的钱包`; // <-- 复制这一行
document.getElementById('no-wallet-placeholder').style.display = 'none';
document.getElementById('ai-wallet-transactions-list').style.display = 'block';
renderAiWalletTransactions(cachedData.transactions);
switchScreen('ai-space-wallet-transactions-screen');
break;
                   case 'unlock':
                       renderPeekUnlock(cachedData);
                       switchScreen('peek-unlock-screen');
                       break;
               }
               return; // Stop execution since we used cache
           }

            const char = db.characters.find(c => c.id === currentChatId);
            if (!char) return showToast('无法找到当前角色');

            const { url, key, model, provider } = db.apiSettings;
            if (!url || !key || !model) {
                showToast('请先在“api”应用中完成设置！');
                return switchScreen('api-settings-screen');
            }

            generatingPeekApps.add(appType); // Lock this specific app
            let targetContainer;

            // Show loading state
            switch (appType) {
                case 'messages':
                    switchScreen('peek-messages-screen');
                    targetContainer = document.getElementById('peek-chat-list-container');
                    targetContainer.innerHTML = '<p class="placeholder-text">正在生成对话列表...</p>';
                    break;
                case 'album':
                    switchScreen('peek-album-screen');
                    renderPeekAlbum([]); // 渲染空状态，会显示“正在生成...”
                    break;
                case 'memos':
                    switchScreen('peek-memos-screen');
                    renderMemosList([]); // Render empty state with loading text
                    break;
               case 'transfer':
                   switchScreen('peek-transfer-station-screen');
                   renderPeekTransferStation([]);
                   break;
                case 'cart':
                    switchScreen('peek-cart-screen');
                    renderPeekCart([]);
                    break;
                case 'browser':
                    switchScreen('peek-browser-screen');
                    renderPeekBrowser([]);
                    break;
                case 'drafts':
                    switchScreen('peek-drafts-screen');
                    renderPeekDrafts(null);
                    break;
                case 'steps':
                    switchScreen('peek-steps-screen');
                    renderPeekSteps(null); // Render empty state
                    break;
                case 'wallet':
document.getElementById('ai-wallet-transactions-title').textContent = `${char.remarkName}的钱包`; // <-- 复制这一行
switchScreen('ai-space-wallet-transactions-screen');
// 加载状态：隐藏列表，显示占位符
document.getElementById('ai-wallet-transactions-list').style.display = 'none';
const walletPlaceholder = document.getElementById('no-wallet-placeholder');
walletPlaceholder.innerHTML = '<p class="placeholder-text">正在生成账单...</p>';
walletPlaceholder.style.display = 'block';
break;
               case 'unlock':
                   switchScreen('peek-unlock-screen');
                   renderPeekUnlock(null); // Render empty/loading state
                   break;
               default:
                   showToast('无法打开');
                   generatingPeekApps.delete(appType); // Unlock if app is invalid
                   return;
           }

            try {
                const mainChatContext = char.history.slice(-10).map(m => m.content).join('\n');
                const systemPrompt = generatePeekContentPrompt(char, appType, mainChatContext);
                
                const requestBody = {
                    model: model,
                    messages: [{ role: 'user', content: systemPrompt }],
                    temperature: 0.8,
                    top_p: 0.9,
                };

                const endpoint = `${url}/v1/chat/completions`;
                const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };

                const response = await fetch(endpoint, { method: 'POST', headers: headers, body: JSON.stringify(requestBody) });
                if (!response.ok) {
                    const error = new Error(`API Error: ${response.status} ${await response.text()}`);
                    error.response = response;
                    throw error;
                }
                
                const result = await response.json();
                const contentStr = result.choices[0].message.content;
                
                const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error("AI响应中未找到有效的JSON对象。");
                
                const generatedData = JSON.parse(jsonMatch[0]);

                // --- NEW: Strict data validation ---
                let isValid = false;
                switch (appType) {
                    case 'messages': isValid = generatedData && Array.isArray(generatedData.conversations); break;
                    case 'memos': isValid = generatedData && Array.isArray(generatedData.memos); break;
                    case 'album': isValid = generatedData && Array.isArray(generatedData.photos); break;
                    case 'cart': isValid = generatedData && Array.isArray(generatedData.items); break;
                    case 'transfer': isValid = generatedData && Array.isArray(generatedData.entries); break;
                    case 'browser': isValid = generatedData && Array.isArray(generatedData.history); break;
                    case 'drafts': isValid = generatedData && generatedData.draft; break;
                    case 'steps': isValid = generatedData && generatedData.currentSteps !== undefined; break;
                case 'wallet': isValid = generatedData && Array.isArray(generatedData.transactions); break;
                    case 'unlock': isValid = generatedData && generatedData.nickname && Array.isArray(generatedData.posts); break;
                    default: isValid = false;
                }

                if (!isValid) {
                    throw new Error("AI返回的数据格式不符合应用要求。");
                }
                // --- END: Strict data validation ---

                // Store in cache
                peekContentCache[appType] = generatedData;
                peekContentCache[appType].charName = char.remarkName; // <-- 复制这一行

                // Render content based on app type
                if (appType === 'messages') {
                    renderPeekChatList(generatedData.conversations);
                } else if (appType === 'memos') {
                    renderMemosList(generatedData.memos);
                } else if (appType === 'album') {
                    renderPeekAlbum(generatedData.photos);
                } else if (appType === 'transfer') {
                   renderPeekTransferStation(generatedData.entries);
                } else if (appType === 'cart') {
                    renderPeekCart(generatedData.items);
                } else if (appType === 'browser') {
                    renderPeekBrowser(generatedData.history);
                } else if (appType === 'drafts') {
                    renderPeekDrafts(generatedData.draft);
                } else if (appType === 'steps') {
                    renderPeekSteps(generatedData);
} else if (appType === 'wallet') {
renderAiWalletTransactions(generatedData.transactions);
                } else if (appType === 'unlock') {
                    renderPeekUnlock(generatedData);
                }

            } catch (error) {
                showApiError(error);
                // Clear cache for this app on failure
                delete peekContentCache[appType];
                const errorMessage = "内容生成失败，请刷新重试。";
                if (appType === 'album') {
                    document.querySelector('#peek-album-screen .album-grid').innerHTML = `<p class="placeholder-text">${errorMessage}</p>`;
                } else if (appType === 'unlock') {
                    document.getElementById('peek-unlock-screen').innerHTML = `<header class="app-header"><button class="back-btn" data-target="peek-screen">‹</button><div class="title-container"><h1 class="title">错误</h1></div><button class="action-btn">···</button></header><main class="content"><p class="placeholder-text">${errorMessage}</p></main>`;
                } else if (targetContainer) {
                    targetContainer.innerHTML = `<p class="placeholder-text">${errorMessage}</p>`;
                }
            } finally {
                generatingPeekApps.delete(appType); // Release the lock for this specific app
            }
        }

        function renderPeekSettings() {
            const character = db.characters.find(c => c.id === currentChatId);
            if (!character) return;

            const peekSettings = character.peekScreenSettings || { wallpaper: '', customIcons: {}, unlockAvatar: '' };

            // Populate wallpaper
            document.getElementById('peek-wallpaper-url-input').value = peekSettings.wallpaper || '';

            const iconsContainer = document.getElementById('peek-app-icons-settings');
            iconsContainer.innerHTML = '';

            Object.keys(peekScreenApps).forEach(appId => {
                const app = peekScreenApps[appId];
                const currentIcon = peekSettings.customIcons?.[appId] || app.url;

                const itemEl = document.createElement('div');
                itemEl.className = 'icon-custom-item';
                itemEl.innerHTML = `
                    <img src="${currentIcon}" alt="${app.name}" class="icon-preview">
                    <div class="icon-details">
                        <p>${app.name}</p>
                        <input type="url" class="form-group" data-app-id="${appId}" placeholder="粘贴新的图标URL" value="${peekSettings.customIcons?.[appId] || ''}">
                    </div>
                    <input type="file" id="peek-icon-upload-${appId}" data-app-id="${appId}" accept="image/*" style="display:none;">
                    <label for="peek-icon-upload-${appId}" class="btn btn-small btn-neutral" style="font-size: 12px;">上传</label>
                `;
                iconsContainer.appendChild(itemEl);
            });

            // Add event listeners for all new upload buttons
            iconsContainer.querySelectorAll('input[type="file"]').forEach(uploadInput => {
                uploadInput.addEventListener('change', handlePeekIconUpload);
            });
            
            // Populate unlock avatar url
            document.getElementById('peek-unlock-avatar-url').value = peekSettings.unlockAvatar || '';
        }

        async function handlePeekIconUpload(e) {
            const file = e.target.files[0];
            const appId = e.target.dataset.appId;
            if (file && appId) {
                try {
                    const compressedUrl = await compressImage(file, { quality: 0.8, maxWidth: 120, maxHeight: 120 });
                    const urlInput = document.querySelector(`#peek-app-icons-settings input[data-app-id="${appId}"]`);
                    const previewImg = urlInput.closest('.icon-custom-item').querySelector('.icon-preview');
                    if (urlInput) {
                        urlInput.value = compressedUrl;
                    }
                    if (previewImg) {
                        previewImg.src = compressedUrl;
                    }
                    showToast(`${peekScreenApps[appId].name} 图标已上传并压缩`);
                } catch (error) {
                    showToast('图标压缩失败，请重试');
                }
            }
        }

        // ========================================
        // 🎨 NovelAI 生图功能 - 事件监听与基础逻辑
        // ========================================

        // --- NovelAI API 设置页面的事件监听 ---
        const novelaiSwitch = document.getElementById('novelai-switch');
        const novelaiDetailsDiv = document.getElementById('novelai-details');
        const novelaiApiKeyInput = document.getElementById('novelai-api-key');
        const novelaiKeyToggle = document.getElementById('novelai-key-toggle');
        const novelaiSettingsBtn = document.getElementById('novelai-settings-btn');
        const novelaiTestBtn = document.getElementById('novelai-test-btn');
        const novelaiModelSelect = document.getElementById('novelai-model'); // 新增：模型选择器

        if (novelaiSwitch && novelaiDetailsDiv) {
            novelaiSwitch.addEventListener('change', (e) => {
                novelaiDetailsDiv.style.display = e.target.checked ? 'block' : 'none';
                // 保存开关状态到 localStorage
                localStorage.setItem('novelai-enabled', e.target.checked);
            });
        }

        if (novelaiKeyToggle && novelaiApiKeyInput) {
            novelaiKeyToggle.addEventListener('click', function() {
                if (novelaiApiKeyInput.type === 'password') {
                    novelaiApiKeyInput.type = 'text';
                    this.textContent = '😌';
                } else {
                    novelaiApiKeyInput.type = 'password';
                    this.textContent = '🧐';
                }
            });
        }

        // 新增：保存 API Key 和模型选择到 localStorage
        if (novelaiApiKeyInput) {
            novelaiApiKeyInput.addEventListener('change', () => {
                localStorage.setItem('novelai-api-key', novelaiApiKeyInput.value.trim());
            });
        }
        if (novelaiModelSelect) {
            novelaiModelSelect.addEventListener('change', () => {
                localStorage.setItem('novelai-model', novelaiModelSelect.value);
            });
        }


        // --- NovelAI 生成设置弹窗的事件监听 ---
        const novelaiSettingsModal = document.getElementById('novelai-settings-modal');
        const closeNovelaiSettingsBtn = document.getElementById('close-novelai-settings');
        const saveNaiSettingsBtn = document.getElementById('save-nai-settings-btn');
        const resetNaiSettingsBtn = document.getElementById('reset-nai-settings-btn');
        const naiCorsProxySelect = document.getElementById('nai-cors-proxy');
        const naiCustomProxyGroup = document.getElementById('nai-custom-proxy-group');

        if (novelaiSettingsBtn && novelaiSettingsModal) {
            novelaiSettingsBtn.addEventListener('click', () => {
                loadNovelAISettings(); // 打开弹窗前加载现有设置
                novelaiSettingsModal.classList.add('visible'); // 使用 visible 类控制显示
            });
        }

        if (closeNovelaiSettingsBtn && novelaiSettingsModal) {
            closeNovelaiSettingsBtn.addEventListener('click', () => {
                novelaiSettingsModal.classList.remove('visible'); // 使用 visible 类控制隐藏
            });
        }

        if (saveNaiSettingsBtn && novelaiSettingsModal) {
            saveNaiSettingsBtn.addEventListener('click', () => {
                saveNovelAISettings();
                novelaiSettingsModal.classList.remove('visible');
                showToast('NovelAI 设置已保存！'); // 使用您项目中的提示函数
            });
        }

        if (resetNaiSettingsBtn) {
            resetNaiSettingsBtn.addEventListener('click', () => {
                if (confirm('确定要恢复 NovelAI 生成设置到默认值吗？')) {
                    resetNovelAISettings();
                    showToast('已恢复默认设置！');
                }
            });
        }

        if (naiCorsProxySelect && naiCustomProxyGroup) {
            naiCorsProxySelect.addEventListener('change', (e) => {
                naiCustomProxyGroup.style.display = (e.target.value === 'custom') ? 'block' : 'none';
            });
        }

        // --- NovelAI 测试生成弹窗的事件监听 ---
        const novelaiTestModal = document.getElementById('novelai-test-modal');
        const closeNovelaiTestBtn = document.getElementById('close-novelai-test');
        const closeNaiTestBtnFooter = document.getElementById('close-nai-test-btn'); // 弹窗底部的关闭按钮
        const naiGenerateBtn = document.getElementById('nai-generate-btn');
        const naiResultImage = document.getElementById('nai-result-image'); // 获取图片元素（支持三击下载）

        if (novelaiTestBtn && novelaiTestModal && novelaiApiKeyInput) {
            novelaiTestBtn.addEventListener('click', () => {
                const apiKey = novelaiApiKeyInput.value.trim();
                if (!apiKey) {
                    showToast('请先填写 NovelAI API Key！');
                    return;
                }
                // 重置测试弹窗状态
                document.getElementById('nai-test-prompt').value = '1girl, solo, long hair, blue eyes, smile, outdoors, cherry blossoms, spring';
                document.getElementById('nai-test-negative').value = '';
                document.getElementById('nai-test-status').style.display = 'none';
                document.getElementById('nai-test-result').style.display = 'none';
                document.getElementById('nai-test-error').style.display = 'none';
                if (naiResultImage) naiResultImage.src = ''; // 清空上次的图片

                novelaiTestModal.classList.add('visible');
            });
        }

        if (closeNovelaiTestBtn && novelaiTestModal) {
            closeNovelaiTestBtn.addEventListener('click', () => {
                novelaiTestModal.classList.remove('visible');
            });
        }
        if (closeNaiTestBtnFooter && novelaiTestModal) { // 绑定底部关闭按钮
            closeNaiTestBtnFooter.addEventListener('click', () => {
                novelaiTestModal.classList.remove('visible');
            });
        }

        if (naiGenerateBtn) {
            naiGenerateBtn.addEventListener('click', async () => {
                // 调用生成函数（将在后续步骤中实现完整逻辑）
                await generateNovelAIImage();
            });
        }

        // 删除下载按钮的事件监听器，改用三击下载功能（已在第9984行初始化）

        // --- 角色专属提示词弹窗的事件监听 ---
        const characterNaiPromptsModal = document.getElementById('character-nai-prompts-modal');
        const openCharacterNaiBtn = document.getElementById('character-nai-prompts-btn');
        const openGroupNaiBtn = document.getElementById('group-character-nai-prompts-btn');
        const closeCharacterNaiBtn = document.getElementById('close-character-nai-prompts');
        const saveCharacterNaiBtn = document.getElementById('save-character-nai-prompts-btn');
        const resetCharacterNaiBtn = document.getElementById('reset-character-nai-prompts-btn');
        const characterNaiPositiveInput = document.getElementById('character-nai-positive');
        const characterNaiNegativeInput = document.getElementById('character-nai-negative');

        // 打开弹窗的逻辑（合并私聊和群聊按钮）
        const openNaiPromptModal = () => {
            // 检查当前聊天是否存在
            const chat = (currentChatType === 'private')
                ? db.characters.find(c => c.id === currentChatId)
                : db.groups.find(g => g.id === currentChatId);

            if (!chat) {
                showToast('请先选择一个聊天');
                return;
            }

            // 加载当前角色/群聊的 NAI 提示词配置
            const naiSettings = chat.naiSettings || { // 统一使用 naiSettings 字段
                positivePrompt: '',
                negativePrompt: ''
            };

            // 填充弹窗内容
            characterNaiPositiveInput.value = naiSettings.positivePrompt || '';
            characterNaiNegativeInput.value = naiSettings.negativePrompt || '';

            characterNaiPromptsModal.classList.add('visible');
        };

        if (openCharacterNaiBtn) {
            openCharacterNaiBtn.addEventListener('click', openNaiPromptModal);
        }
        if (openGroupNaiBtn) {
            openGroupNaiBtn.addEventListener('click', openNaiPromptModal);
        }

        if (closeCharacterNaiBtn && characterNaiPromptsModal) {
            closeCharacterNaiBtn.addEventListener('click', () => {
                characterNaiPromptsModal.classList.remove('visible');
            });
        }

        if (saveCharacterNaiBtn && characterNaiPromptsModal) {
            saveCharacterNaiBtn.addEventListener('click', async () => {
                const chat = (currentChatType === 'private')
                    ? db.characters.find(c => c.id === currentChatId)
                    : db.groups.find(g => g.id === currentChatId);

                if (!chat) return;

                // 确保 naiSettings 对象存在
                if (!chat.naiSettings) {
                    chat.naiSettings = {};
                }

                // 保存提示词
                chat.naiSettings.positivePrompt = characterNaiPositiveInput.value.trim();
                chat.naiSettings.negativePrompt = characterNaiNegativeInput.value.trim();

                console.log(`💾 保存 ${currentChatType === 'private' ? '角色' : '群聊'} [${chat.id}] NAI提示词`);
                console.log('   Positive:', chat.naiSettings.positivePrompt || '(空)');
                console.log('   Negative:', chat.naiSettings.negativePrompt || '(空)');

                await saveData(); // 保存到数据库

                characterNaiPromptsModal.classList.remove('visible');
                showToast(`${currentChatType === 'private' ? '角色' : '群聊'}专属 NAI 提示词已保存！`);
            });
        }

        if (resetCharacterNaiBtn) {
            resetCharacterNaiBtn.addEventListener('click', () => {
                if (confirm(`确定要清空当前${currentChatType === 'private' ? '角色' : '群聊'}的 NAI 提示词配置吗？`)) {
                    characterNaiPositiveInput.value = '';
                    characterNaiNegativeInput.value = '';
                    // 不需要立即保存，用户需要点击"保存"按钮确认
                    showToast('已清空输入框，请点击保存生效。');
                }
            });
        }

        // --- NovelAI 设置相关函数 (加载/保存/重置) ---

        // 获取 NovelAI 设置 (合并默认值与 localStorage)
        function getNovelAISettings() {
            const defaultSettings = {
                resolution: '1024x1024',
                steps: 28,
                cfg_scale: 5,
                sampler: 'k_euler_ancestral',
                seed: -1,
                uc_preset: 1, // Preset 1 - Light
                quality_toggle: true,
                smea: true,
                smea_dyn: false,
                // ▼▼▼ 用下面两行替换它们 ▼▼▼
                default_positive: localStorage.getItem('nai-global-positive') || 'masterpiece, best quality, 1girl, beautiful, detailed face, detailed eyes, long hair, anime style',
                default_negative: localStorage.getItem('nai-global-negative') || 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
                cors_proxy: 'https://corsproxy.io/?',
                custom_proxy_url: ''
            };

            const saved = localStorage.getItem('novelai-settings');
            let mergedSettings = defaultSettings;
            if (saved) {
                try {
                    // 合并时，确保存储的值类型正确
                    const parsed = JSON.parse(saved);
                    mergedSettings = {
                        ...defaultSettings,
                        ...parsed,
                        // 强制转换类型以防存储了错误类型
                        steps: parseInt(parsed.steps) || defaultSettings.steps,
                        cfg_scale: parseFloat(parsed.cfg_scale) || defaultSettings.cfg_scale,
                        seed: parseInt(parsed.seed) || defaultSettings.seed,
                        uc_preset: parseInt(parsed.uc_preset) || defaultSettings.uc_preset,
                        quality_toggle: typeof parsed.quality_toggle === 'boolean' ? parsed.quality_toggle : defaultSettings.quality_toggle,
                        smea: typeof parsed.smea === 'boolean' ? parsed.smea : defaultSettings.smea,
                        smea_dyn: typeof parsed.smea_dyn === 'boolean' ? parsed.smea_dyn : defaultSettings.smea_dyn,
                    };
                } catch (e) {
                    console.error("解析 NovelAI 设置失败:", e);
                    // 解析失败则使用默认值
                }
            }
            return mergedSettings;
        }

        // 加载设置到 NovelAI 设置弹窗
        function loadNovelAISettings() {
            const settings = getNovelAISettings();
            // 填充弹窗内的表单元素
            document.getElementById('nai-resolution').value = settings.resolution;
            document.getElementById('nai-steps').value = settings.steps;
            document.getElementById('nai-cfg-scale').value = settings.cfg_scale;
            document.getElementById('nai-sampler').value = settings.sampler;
            document.getElementById('nai-seed').value = settings.seed;
            document.getElementById('nai-uc-preset').value = settings.uc_preset;
            document.getElementById('nai-quality-toggle').checked = settings.quality_toggle;
            document.getElementById('nai-smea').checked = settings.smea;
            document.getElementById('nai-smea-dyn').checked = settings.smea_dyn;
            document.getElementById('nai-default-positive').value = settings.default_positive;
            document.getElementById('nai-default-negative').value = settings.default_negative;
            document.getElementById('nai-cors-proxy').value = settings.cors_proxy;
            document.getElementById('nai-custom-proxy-url').value = settings.custom_proxy_url || '';

            // 根据 CORS 代理选择显示/隐藏自定义输入框
            const customProxyGroup = document.getElementById('nai-custom-proxy-group');
            customProxyGroup.style.display = settings.cors_proxy === 'custom' ? 'block' : 'none';
        
            populateNaiPromptPresetSelect(); // ▼▼▼ 新增：填充预设下拉框 ▼▼▼
        }

        // 从 NovelAI 设置弹窗保存设置
        function saveNovelAISettings() {
            // 保存 API 设置页面的基础配置 (开关状态已在事件监听中保存)
            localStorage.setItem('novelai-api-key', document.getElementById('novelai-api-key').value.trim());
            localStorage.setItem('novelai-model', document.getElementById('novelai-model').value);

            // 保存高级参数配置
            const settings = {
                resolution: document.getElementById('nai-resolution').value,
                steps: parseInt(document.getElementById('nai-steps').value) || 28, // 提供默认值
                cfg_scale: parseFloat(document.getElementById('nai-cfg-scale').value) || 5, // 提供默认值
                sampler: document.getElementById('nai-sampler').value,
                seed: parseInt(document.getElementById('nai-seed').value) || -1, // 提供默认值
                uc_preset: parseInt(document.getElementById('nai-uc-preset').value), // select 不需要默认值
                quality_toggle: document.getElementById('nai-quality-toggle').checked,
                smea: document.getElementById('nai-smea').checked,
                smea_dyn: document.getElementById('nai-smea-dyn').checked,
                default_positive: document.getElementById('nai-default-positive').value.trim(),
                default_negative: document.getElementById('nai-default-negative').value.trim(),
                cors_proxy: document.getElementById('nai-cors-proxy').value,
                custom_proxy_url: document.getElementById('nai-custom-proxy-url').value.trim()
            };

            // ▼▼▼ 新增：保存当前设置为"默认" ▼▼▼
            localStorage.setItem('nai-global-positive', settings.default_positive);
            localStorage.setItem('nai-global-negative', settings.default_negative);
            // ▲▲▲ 新增结束 ▲▲▲

            localStorage.setItem('novelai-settings', JSON.stringify(settings));
        }

        // 恢复默认设置
        function resetNovelAISettings() {
            localStorage.removeItem('novelai-settings');
            // ▼▼▼ 新增：清除已保存的默认值 ▼▼▼
            localStorage.removeItem('nai-global-positive');
            localStorage.removeItem('nai-global-negative');
            // ▲▲▲ 新增结束 ▲▲▲
            // 恢复默认设置后，需要重新加载默认值到弹窗中
            loadNovelAISettings();
        }

        // ========================================
        // ⚙️ NovelAI 生图功能 - 核心逻辑
        // ========================================

        /**
         * 调用 NovelAI API 生成图像 (用于测试弹窗)
         */
        async function generateNovelAIImage() {
            // 从 localStorage 或 DOM 获取基础设置
            const apiKey = localStorage.getItem('novelai-api-key') || '';
            const model = localStorage.getItem('novelai-model') || 'nai-diffusion-4-5-full';
            const prompt = document.getElementById('nai-test-prompt').value.trim();
            const negativePromptTest = document.getElementById('nai-test-negative').value.trim(); // 测试弹窗的负面提示词

            // 获取包含高级参数和默认提示词的系统设置
            const settings = getNovelAISettings();
            // 决定最终使用的负面提示词
            const finalNegativePrompt = negativePromptTest || settings.default_negative;

            // 基本校验
            if (!apiKey) {
                showToast('请先配置 NovelAI API Key！');
                return;
            }
            if (!prompt) {
                showToast('请输入正面提示词！');
                return;
            }

            // 获取 UI 元素用于状态更新
            const statusDiv = document.getElementById('nai-test-status');
            const resultDiv = document.getElementById('nai-test-result');
            const errorDiv = document.getElementById('nai-test-error');
            const generateBtn = document.getElementById('nai-generate-btn');
            const resultImage = document.getElementById('nai-result-image');

            // 更新 UI 状态：显示加载中
            statusDiv.textContent = '正在请求 NovelAI API...';
            statusDiv.style.display = 'block';
            resultDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            resultImage.src = '';
            generateBtn.disabled = true;
            generateBtn.textContent = '生成中...';

            try {
                const [width, height] = settings.resolution.split('x').map(Number);
                let requestBody;
                let apiUrl;

                // ★★★ 根据模型版本构建不同的请求体和 API 端点 ★★★
                if (model.includes('nai-diffusion-4')) {
                    // V4/V4.5 使用新格式 (params_version: 3) 和流式端点
                    apiUrl = 'https://image.novelai.net/ai/generate-image-stream';
                    requestBody = {
                        input: prompt, // 注意：V4.5 这里其实是用 v4_prompt 替代，但为了简单兼容，保留 input
                        model: model,
                        action: 'generate',
                        parameters: {
                            params_version: 3,
                            width: width,
                            height: height,
                            scale: settings.cfg_scale,
                            sampler: settings.sampler,
                            steps: settings.steps,
                            seed: settings.seed === -1 ? Math.floor(Math.random() * 9999999999) : settings.seed,
                            n_samples: 1,
                            ucPreset: settings.uc_preset,
                            qualityToggle: settings.quality_toggle,
                            // V4 特定参数 (部分可能 V3 不支持)
                            autoSmea: false, // 似乎不再使用 sm/sm_dyn，可能是内部处理或通过 qualityToggle
                            dynamic_thresholding: false,
                            controlnet_strength: 1,
                            legacy: false,
                            add_original_image: true, // V4 需要
                            cfg_rescale: 0,
                            noise_schedule: 'karras', // V4 推荐
                            legacy_v3_extend: false,
                            // V4 特有的 prompt 结构
                            v4_prompt: {
                                caption: { base_caption: prompt, char_captions: [] },
                                use_coords: false,
                                use_order: true
                            },
                            // V4 特有的 negative prompt 结构
                            v4_negative_prompt: {
                                caption: { base_caption: finalNegativePrompt, char_captions: [] },
                                legacy_uc: false
                            },
                            negative_prompt: finalNegativePrompt, // 仍然需要传递
                            prefer_brownian: true // V4.5 新增?
                            // 注意：V4 Stream 不包含 sm, sm_dyn
                        }
                    };
                } else {
                    // V3 及更早版本使用旧格式和标准端点
                    apiUrl = 'https://image.novelai.net/ai/generate-image';
                    requestBody = {
                        input: prompt,
                        model: model,
                        action: 'generate',
                        parameters: {
                            width: width,
                            height: height,
                            scale: settings.cfg_scale,
                            sampler: settings.sampler,
                            steps: settings.steps,
                            seed: settings.seed === -1 ? Math.floor(Math.random() * 9999999999) : settings.seed,
                            n_samples: 1,
                            ucPreset: settings.uc_preset,
                            qualityToggle: settings.quality_toggle,
                            sm: settings.smea,         // V3 使用 sm
                            sm_dyn: settings.smea_dyn, // V3 使用 sm_dyn
                            dynamic_thresholding: false,
                            controlnet_strength: 1,
                            legacy: false,
                            add_original_image: false, // V3 不需要
                            cfg_rescale: 0,
                            noise_schedule: 'native', // V3 使用 native
                            negative_prompt: finalNegativePrompt
                        }
                    };
                }

                console.log('📤 发送请求到 NovelAI API');
                console.log('📊 使用模型:', model);
                // console.log('📋 请求体:', JSON.stringify(requestBody, null, 2)); // 打印完整请求体用于调试

                // --- CORS 代理处理 ---
                let corsProxy = settings.cors_proxy;
                if (corsProxy === 'custom') {
                    corsProxy = settings.custom_proxy_url || '';
                }
                if (corsProxy && corsProxy !== '' && !apiUrl.startsWith('http://localhost') && !apiUrl.startsWith('http://127.0.0.1')) { // 本地地址不加代理
                     // NAI API URL 需要被编码
                     apiUrl = corsProxy + encodeURIComponent(apiUrl);
                     console.log('🔗 使用 CORS 代理:', corsProxy);
                } else {
                     console.log('🔗 直连 NovelAI API');
                }


                // --- 发起 Fetch 请求 ---
                const fetchOptions = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + apiKey
                    },
                    body: JSON.stringify(requestBody)
                };

                const response = await fetch(apiUrl, fetchOptions);
                console.log('Response Status:', response.status);

                // --- 处理响应 ---
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API 错误响应:', errorText);
                    // 尝试解析常见的错误信息
                    let friendlyError = `API 请求失败 (${response.status})`;
                    if (errorText.includes('Unauthorized')) friendlyError += ': API Key 无效或错误。';
                    else if (errorText.includes('credits')) friendlyError += ': 点数不足。';
                    else if (errorText.includes('subscription')) friendlyError += ': 需要有效的订阅。';
                    else if (response.status === 429) friendlyError += ': 请求过于频繁，请稍后再试。';
                    else if (response.status === 403) friendlyError += ': 禁止访问，可能是并发限制或权限问题。';
                    else friendlyError += `: ${errorText.substring(0, 100)}`; // 显示部分错误文本
                    throw new Error(friendlyError);
                }

                const contentType = response.headers.get('content-type');
                console.log('Response Content-Type:', contentType);

                let imageBlob;

                // --- 处理 V4.5 流式响应 (SSE) ---
                if (contentType && contentType.includes('text/event-stream')) {
                    statusDiv.textContent = '正在接收流式数据...';
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    let base64Data = null;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });

                        // 处理 SSE 事件块
                        const eventEndIndex = buffer.indexOf('\n\n');
                        if (eventEndIndex !== -1) {
                            const eventData = buffer.substring(0, eventEndIndex);
                            buffer = buffer.substring(eventEndIndex + 2); // 移除已处理的部分

                            const lines = eventData.split('\n');
                            for (const line of lines) {
                                if (line.startsWith('data: ')) {
                                    const dataContent = line.substring(6).trim();
                                    if (dataContent && dataContent !== '[DONE]') {
                                        try {
                                            const jsonData = JSON.parse(dataContent);
                                            // V4.5 流式响应在 final 事件中包含 base64 图片
                                            if (jsonData.event_type === 'final' && jsonData.image) {
                                                base64Data = jsonData.image;
                                                console.log('✅ 从 SSE final 事件提取图片数据');
                                            }
                                            // 也可以检查其他可能的 data 字段
                                            else if (jsonData.data && typeof jsonData.data === 'string') {
                                                 base64Data = jsonData.data;
                                                 console.log('✅ 从 SSE data 字段提取图片数据');
                                            }
                                        } catch (e) {
                                            // 如果不是 JSON，直接当作 base64 数据 (兼容旧格式?)
                                            base64Data = dataContent;
                                            console.log('⚠️ SSE data 不是 JSON，直接使用');
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (!base64Data) {
                        throw new Error('无法从 SSE 响应中提取图片数据');
                    }

                    // V4.5 流式直接返回 PNG base64
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    imageBlob = new Blob([bytes], { type: 'image/png' }); // 假设是 PNG
                    console.log('✅ SSE 图片 Blob 创建成功, 大小:', imageBlob.size);

                } else {
                    // --- 处理 V3 或非流式响应 (可能是 ZIP 或直接图片) ---
                    statusDiv.textContent = '正在下载图片数据...';
                    const responseData = await response.blob();
                    console.log('收到数据，类型:', responseData.type, '大小:', responseData.size);

                    // 如果 Content-Type 直接是图片类型，直接使用
                    if (responseData.type.startsWith('image/')) {
                        console.log('✅ 响应直接为图片格式');
                        imageBlob = responseData;
                    }
                    // 否则，假设是 ZIP 文件 (NovelAI V3 的标准返回格式)
                    else if (responseData.type === 'application/zip' || responseData.type === 'application/octet-stream') {
                        statusDiv.textContent = '正在解压图片...';
                        // ★★★ 检查 JSZip 是否已加载 ★★★
                        if (typeof JSZip === 'undefined') {
                             throw new Error('需要 JSZip 库来解压图片。请在 HTML 中引入 JSZip。');
                         }
                        try {
                            const zip = await JSZip.loadAsync(responseData);
                            console.log('ZIP 文件内容:', Object.keys(zip.files));
                            let imageFile = null;
                            // 查找第一个图片文件
                            for (const filename in zip.files) {
                                if (filename.match(/\.(png|jpg|jpeg|webp)$/i)) {
                                    imageFile = zip.files[filename];
                                    console.log('找到图片文件:', filename);
                                    break;
                                }
                            }
                            if (!imageFile) {
                                throw new Error('ZIP 文件中未找到图片');
                            }
                            imageBlob = await imageFile.async('blob');
                            console.log('✅ ZIP 解压成功, 提取图片大小:', imageBlob.size);
                        } catch (zipError) {
                            console.error('ZIP 解压失败:', zipError);
                            throw new Error('图片解压失败: ' + zipError.message);
                        }
                    } else {
                        // 未知响应类型
                        throw new Error(`未知的响应类型: ${responseData.type}`);
                    }
                }

                // --- 显示图片 ---
                if (imageBlob) {
                    const imageUrl = URL.createObjectURL(imageBlob);
                    resultImage.onload = () => URL.revokeObjectURL(imageUrl); // 释放内存
                    // 确保图片有 naiimag-image 类，以便三击下载功能识别
                    resultImage.classList.add('naiimag-image');
                    resultImage.src = imageUrl;
                    // 设置 title 以便生成文件名
                    const promptText = document.getElementById('nai-test-prompt').value.trim();
                    resultImage.title = promptText || 'NovelAI 测试生成';
                    resultImage.alt = promptText || 'NovelAI Generated Image';
                    statusDiv.style.display = 'none';
                    resultDiv.style.display = 'block';
                    console.log('✅ 图片显示成功！🎨 (三击图片可下载)');
                } else {
                    throw new Error('未能获取到有效的图片数据');
                }

            } catch (error) {
                console.error('NovelAI 生成失败:', error);
                statusDiv.style.display = 'none';
                errorDiv.style.display = 'block';
                // 使用您项目中的 showApiError 或直接显示
                errorDiv.textContent = '生成失败: ' + error.message;
                // 或者调用 showApiError(error);
            } finally {
                // 恢复按钮状态
                generateBtn.disabled = false;
                generateBtn.textContent = '生成图像';
            }
        }

        // ========================================
        // 🎨 NovelAI 生图功能 - 聊天集成逻辑
        // ========================================

        /**
         * 获取当前聊天（角色或群聊）的NAI提示词配置
         * @param {string} chatId - 聊天ID
         * @param {string} chatType - 聊天类型 ('private' 或 'group')
         * @returns {object} { positive: string, negative: string, source: string }
         */
        function getCharacterNAIPrompts(chatId, chatType) {
            // 1. 获取系统默认配置
            const systemSettings = getNovelAISettings();
            const systemPrompts = {
                positive: systemSettings.default_positive,
                negative: systemSettings.default_negative,
                source: 'system' // 统一返回 'system'
            };

            // 2. 移除所有角色专属逻辑，直接返回系统配置
            console.log('✅ NAI提示词：已全局统一，使用系统默认配置');
            return systemPrompts;
        }

        /**
         * 为聊天生成 NovelAI 图像 (v2 - 支持指定发送者)
         * @param {string} userPrompt - 用户或AI输入的提示词
         * @param {string} chatId - 聊天ID
         * @param {string} chatType - 聊天类型 ('private' 或 'group')
         * @param {string|null} senderIdOverride - (仅群聊) 强制指定AI发送者的senderId
         * @returns {string} 返回生成的图像 Data URL
         */
        async function generateNovelAIImageForChat(userPrompt, chatId, chatType, senderIdOverride = null) {
            // 1. 获取基础和高级设置
            const apiKey = localStorage.getItem('novelai-api-key') || '';
            const model = localStorage.getItem('novelai-model') || 'nai-diffusion-4-5-full';
            const settings = getNovelAISettings(); // 高级参数

            if (!apiKey) {
                throw new Error('请先在API设置中配置 NovelAI API Key！');
            }

            // 2. 获取当前聊天专属的提示词 (注意：AI主动发图时，我们通常使用它自己的专属配置)
            const promptsConfig = getCharacterNAIPrompts(chatId, chatType);

            // 3. 组合最终的提示词
            let finalPositivePrompt = userPrompt;
            if (promptsConfig.positive) {
                // 如果用户Prompt和角色专属Prompt都有内容，用逗号连接
                if (finalPositivePrompt) {
                    finalPositivePrompt += `, ${promptsConfig.positive}`;
                } else {
                    finalPositivePrompt = promptsConfig.positive;
                }
            }
            // 确保不会以空逗号开头
            finalPositivePrompt = finalPositivePrompt.startsWith(',') ? finalPositivePrompt.substring(1).trim() : finalPositivePrompt.trim();

            // 4. 获取最终的负面提示词
            // (如果角色配置了负面词，则使用它；否则使用系统默认负面词)
            const finalNegativePrompt = promptsConfig.source === 'character' ? promptsConfig.negative : settings.default_negative;

            console.log('🎨 NAI 聊天作画开始...');
            console.log('   模型:', model);
            console.log('   AI/用户 Prompt:', userPrompt);
            console.log('   专属配置来源:', promptsConfig.source);
            console.log('   最终正面 Prompt:', finalPositivePrompt);
            console.log('   最终负面 Prompt:', finalNegativePrompt);
            console.log('   发送者指定:', senderIdOverride || 'N/A');

            // 5. 构建请求体 (与测试弹窗的逻辑相同)
            const [width, height] = settings.resolution.split('x').map(Number);
            let requestBody;
            let apiUrl;

            if (model.includes('nai-diffusion-4')) {
                apiUrl = 'https://image.novelai.net/ai/generate-image-stream';
                requestBody = {
                    input: finalPositivePrompt,
                    model: model,
                    action: 'generate',
                    parameters: {
                        params_version: 3,
                        width, height,
                        scale: settings.cfg_scale,
                        sampler: settings.sampler,
                        steps: settings.steps,
                        seed: settings.seed === -1 ? Math.floor(Math.random() * 9999999999) : settings.seed,
                        n_samples: 1,
                        ucPreset: settings.uc_preset,
                        qualityToggle: settings.quality_toggle,
                        autoSmea: false,
                        dynamic_thresholding: false,
                        controlnet_strength: 1,
                        legacy: false,
                        add_original_image: true,
                        cfg_rescale: 0,
                        noise_schedule: 'karras',
                        legacy_v3_extend: false,
                        v4_prompt: { caption: { base_caption: finalPositivePrompt, char_captions: [] }, use_coords: false, use_order: true },
                        v4_negative_prompt: { caption: { base_caption: finalNegativePrompt, char_captions: [] }, legacy_uc: false },
                        negative_prompt: finalNegativePrompt,
                        prefer_brownian: true
                    }
                };
            } else {
                apiUrl = 'https://image.novelai.net/ai/generate-image';
                requestBody = {
                    input: finalPositivePrompt,
                    model: model,
                    action: 'generate',
                    parameters: {
                        width, height,
                        scale: settings.cfg_scale,
                        sampler: settings.sampler,
                        steps: settings.steps,
                        seed: settings.seed === -1 ? Math.floor(Math.random() * 9999999999) : settings.seed,
                        n_samples: 1,
                        ucPreset: settings.uc_preset,
                        qualityToggle: settings.quality_toggle,
                        sm: settings.smea,
                        sm_dyn: settings.smea_dyn,
                        dynamic_thresholding: false,
                        controlnet_strength: 1,
                        legacy: false,
                        add_original_image: false,
                        cfg_rescale: 0,
                        noise_schedule: 'native',
                        negative_prompt: finalNegativePrompt
                    }
                };
            }

            // 6. CORS 代理处理
            let corsProxy = settings.cors_proxy;
            if (corsProxy === 'custom') corsProxy = settings.custom_proxy_url || '';
            if (corsProxy && corsProxy !== '' && !apiUrl.startsWith('http://localhost') && !apiUrl.startsWith('http://127.0.0.1')) {
                apiUrl = corsProxy + encodeURIComponent(apiUrl);
            }

            const fetchOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
                body: JSON.stringify(requestBody)
            };

            // 7. 发起请求
            const response = await fetch(apiUrl, fetchOptions);
            if (!response.ok) {
                const errorText = await response.text();
                let friendlyError = `API 请求失败 (${response.status})`;
                if (errorText.includes('Unauthorized')) friendlyError += ': API Key 无效。';
                else if (response.status === 429) friendlyError += ': 请求频繁，请稍后再试。';
                else if (response.status === 403) friendlyError += ': 禁止访问，可能是并发限制。';
                else friendlyError += `: ${errorText.substring(0, 100)}`;
                throw new Error(friendlyError);
            }

            const contentType = response.headers.get('content-type');
            let imageBlob;
            let imageDataUrl;

            // 8. 处理响应 (流式或 ZIP)
            if (contentType && contentType.includes('text/event-stream')) {
                // SSE (V4/V4.5) - 使用更健壮的解析方式
                const text = await response.text();
                const lines = text.trim().split('\n');
                let base64Data = null;
                
                // 从后往前遍历，找到最后一个有效的数据
                for (let i = lines.length - 1; i >= 0; i--) {
                    const line = lines[i].trim();
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        const dataContent = line.substring(6);
                        try {
                            const jsonData = JSON.parse(dataContent);
                            if (jsonData.event_type === 'final' && jsonData.image) {
                                base64Data = jsonData.image;
                                break;
                            }
                            if (jsonData.data) {
                                base64Data = jsonData.data;
                                break;
                            }
                            if (jsonData.image) {
                                base64Data = jsonData.image;
                                break;
                            }
                        } catch (e) {
                            base64Data = dataContent;
                            break;
                        }
                    }
                }
                if (!base64Data) throw new Error('无法从 SSE 响应中提取图片数据');

                const isPNG = base64Data.startsWith('iVBORw0KGgo');
                const isJPEG = base64Data.startsWith('/9j/');

                if (isPNG || isJPEG) {
                    imageDataUrl = `data:${isPNG ? 'image/png' : 'image/jpeg'};base64,${base64Data}`;
                } else {
                    const binaryString = atob(base64Data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
                    imageBlob = new Blob([bytes]);
                }

            } else {
                // ZIP (V3) 或其他格式
                const responseData = await response.blob();
                if (responseData.type.startsWith('image/')) {
                    imageBlob = responseData;
                } else if (responseData.type === 'application/zip' || responseData.type === 'application/octet-stream') {
                    if (typeof JSZip === 'undefined') throw new Error('JSZip 库未加载');
                    imageBlob = responseData;
                } else {
                    throw new Error(`未知的响应类型: ${responseData.type}`);
                }
            }

            // 9. 解压 (如果需要) 并转换为 Data URL
            if (!imageDataUrl && imageBlob) {
                if (imageBlob.type === 'application/zip' || imageBlob.type === 'application/octet-stream') {
                    if (typeof JSZip === 'undefined') throw new Error('JSZip 库未加载');
                    
                    const zip = await JSZip.loadAsync(imageBlob);
                    let imageFile = null;
                    for (const filename in zip.files) {
                        if (filename.match(/\.(png|jpg|jpeg|webp)$/i)) {
                            imageFile = zip.files[filename];
                            break;
                        }
                    }
                    if (!imageFile) throw new Error('ZIP 文件中未找到图片');
                    
                    const blob = await imageFile.async('blob');
                    
                    imageDataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } else {
                    // 直接是图片 Blob
                    imageDataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(imageBlob);
                    });
                }
            }

            console.log(`✅ [NAI核心生成] 成功！`);
            return {
                imageUrl: imageDataUrl,
                fullPrompt: finalPositivePrompt
            };
        }

        // ========================================
        // 🎨 高级消息编辑器功能 (ephone 移植，适配小章鱼)
        // ========================================

        /**
         * 从AI提示词生成NAI图片（用于重新生成功能）
         * @param {string} aiPrompt - AI提示词
         * @param {string} chatId - 聊天ID
         * @returns {Promise<object>} - 返回 { imageUrl, fullPrompt }
         */
        async function generateNaiImageFromPrompt(aiPrompt, chatId) {
            // 适配：小章鱼使用 currentChatType 来判断类型
            const chatType = currentChatType || 'private';
            return await generateNovelAIImageForChat(aiPrompt, chatId, chatType, null);
        }


        /**
         * 处理NAI图片重新生成（适配小章鱼项目）
         * @param {number} timestamp - 消息时间戳
         * @param {HTMLElement} buttonElement - 按钮元素
         */
        async function handleRegenerateNaiImage(timestamp, buttonElement) {
            if (!currentChatId || !timestamp) return;

            const chat = (currentChatType === 'private')
                ? db.characters.find(c => c.id === currentChatId)
                : db.groups.find(g => g.id === currentChatId);

            if (!chat) return;

            const msgIndex = chat.history.findIndex(m => m.timestamp === timestamp);
            if (msgIndex === -1) return;

            const message = chat.history[msgIndex];

            const originalPrompt = message.prompt;

            if (!originalPrompt) {
                showToast("未找到该图片的原始提示词(prompt)。");
                return;
            }

            // 显示加载状态
            buttonElement.disabled = true;
            buttonElement.classList.add('loading');
            const bubble = buttonElement.closest('.message-bubble');
            const imgElement = bubble ? bubble.querySelector('.naiimag-image, .realimag-image') : null;
            if (imgElement) {
                imgElement.style.opacity = '0.5';
            }

            try {
                const generatedData = await generateNaiImageFromPrompt(originalPrompt, currentChatId);

                // 更新数据
                message.imageUrl = generatedData.imageUrl;
                message.fullPrompt = generatedData.fullPrompt;

                // 保存数据
                await saveData();

                // 更新UI
                if (imgElement) {
                    imgElement.src = generatedData.imageUrl;
                    imgElement.title = generatedData.fullPrompt;
                    imgElement.style.opacity = '1';
                }

                showToast("图片已重新生成！");
            } catch (error) {
                console.error("重新生成NAI图片失败:", error);
                showToast(`无法重新生成图片: ${error.message}`);
                if (imgElement) {
                    imgElement.style.opacity = '1';
                }
            } finally {
                buttonElement.disabled = false;
                buttonElement.classList.remove('loading');
            }
        }

        // --- 新增：补上缺失的备份提示函数 ---
        function promptForBackupIfNeeded(triggerType) {
            // 这个函数是可选的，如果不想用，可以保持为空。
            // 但为了防止 "not defined" 错误，函数本身必须存在。
            
            // 简单的示例逻辑：
            const now = Date.now();
            let lastPromptTime = 0;
            try {
                lastPromptTime = parseInt(localStorage.getItem('lastBackupPromptTime') || '0', 10);
            } catch (e) {
                lastPromptTime = 0;
            }

            // 24小时内只提示一次
            const twentyFourHours = 24 * 60 * 60 * 1000;
            if (now - lastPromptTime < twentyFourHours) {
                return;
            }

            let message = '';
            if (triggerType === 'new_char') {
                message = '创建新角色成功！记得定期在"教程"页面备份数据哦。';
            } else if (triggerType === 'history_milestone') {
                message = '聊天记录又多了不少呢，是个备份数据的好时机！';
            }

            if (message) {
                // 使用 showToast 来提示
                // 我们用一个简单的 toast，因为它不会打断用户流程
                if (typeof showToast === 'function') {
                    showToast(message);
                }
                localStorage.setItem('lastBackupPromptTime', now.toString());
            }
        }
        // --- 函数添加结束 ---

        function createWorldBookEntryBlock(entry = {}) {
            const block = document.createElement('div');
            block.className = 'world-book-entry-block';

            const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const isEnabled = entry.enabled !== false;

            block.innerHTML = `
                <div class="entry-controls">
                    <label class="entry-toggle-switch" for="${entryId}-enable">
                        <input type="checkbox" class="entry-enabled-switch" id="${entryId}-enable" ${isEnabled ? 'checked' : ''}>
                        启用此子条目
                    </label>
                    <button type="button" class="entry-delete-btn" title="删除此条目">×</button>
                </div>
                <div class="form-group">
                    <label for="${entryId}-comment">标题 (可选, 仅自己可见)</label>
                    <input type="text" class="entry-comment-input" id="${entryId}-comment" value="${entry.comment || ''}" placeholder="例如：关于角色的童年设定">
                </div>
                <div class="form-group">
                    <label for="${entryId}-keys">关键词 (可选, 英文逗号分隔)</label>
                    <input type="text" class="entry-keys-input" id="${entryId}-keys" value="${(entry.keys || []).join(', ')}" placeholder="例如：地点, 天气">
                </div>
                <div class="form-group">
                    <label for="${entryId}-content">内容 (必填)</label>
                    <textarea class="entry-content-textarea" id="${entryId}-content" rows="5" placeholder="输入详细设定...">${entry.content || ''}</textarea>
                </div>
            `;

            // 使用事件委托，确保删除按钮的点击事件能正常工作
            const deleteBtn = block.querySelector('.entry-delete-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation(); // 阻止其他事件监听器
                    
                    if (confirm('确定要删除这个子条目吗？')) {
                        // 确保删除操作执行
                        const parent = block.parentNode;
                        if (parent) {
                            parent.removeChild(block);
                        } else {
                            // 如果parentNode不存在，尝试使用remove()
                            try {
                                block.remove();
                            } catch (err) {
                                console.error('删除子条目失败:', err);
                            }
                        }
                    }
                    return false; // 确保不会触发其他事件
                }, true); // 使用捕获阶段，确保优先执行
            }

            return block;
        }

        function renderTutorialContent() {
            const tutorialContentArea = document.getElementById('tutorial-content-area');
            if (!tutorialContentArea) return;

            const tutorials = [
                {title: '写在前面', imageUrls: ['https://i.postimg.cc/7PgyMG9S/image.jpg']},
                {
                    title: '软件介绍',
                    imageUrls: ['https://i.postimg.cc/VvsJRh6q/IMG-20250713-162647.jpg', 'https://i.postimg.cc/8P5FfxxD/IMG-20250713-162702.jpg', 'https://i.postimg.cc/3r94R3Sn/IMG-20250713-162712.jpg']
                },
                {
                    title: '404',
                    imageUrls: ['https://i.postimg.cc/x8scFPJW/IMG-20250713-162756.jpg', 'https://i.postimg.cc/pX6mfqtj/IMG-20250713-162809.jpg', 'https://i.postimg.cc/YScjV00q/IMG-20250713-162819.jpg', 'https://i.postimg.cc/13VfJw9j/IMG-20250713-162828.jpg']
                },
                {title: '404-群聊', imageUrls: ['https://i.postimg.cc/X7LSmRTJ/404.jpg']}
            ];

            const existingItems = tutorialContentArea.querySelectorAll('.tutorial-item');
            existingItems.forEach(item => item.remove());

            // 清理旧的按钮（如果存在）
            const existingButtons = tutorialContentArea.querySelectorAll('.btn, [class*="buttonRow"]');
            existingButtons.forEach(btn => btn.remove());

            tutorials.forEach(tutorial => {
                const item = document.createElement('div');
                item.className = 'tutorial-item';
                const imagesHtml = tutorial.imageUrls.map(url => `<img src="${url}" alt="${tutorial.title}教程图片" loading="lazy">`).join('');
                item.innerHTML = `<div class="tutorial-header">${tutorial.title}</div><div class="tutorial-content">${imagesHtml}</div>`;
                tutorialContentArea.appendChild(item);
            });

            renderUpdateLog();

            // --- 新增：备份数据按钮 ---
            const backupDataBtn = document.createElement('button');
            backupDataBtn.className = 'btn btn-primary';
            backupDataBtn.style.fontFamily = 'var(--font-family)';
            backupDataBtn.textContent = '备份数据';
            backupDataBtn.disabled = loadingBtn;

            backupDataBtn.addEventListener('click', async () => {
                if(loadingBtn){
                    return
                }
                loadingBtn = true
                try {
                    showToast('正在准备导出数据...');

                    // 创建完整的数据备份对象
                    const fullBackupData = await createFullBackupData();

                    const jsonString = JSON.stringify(fullBackupData);
                    const dataBlob = new Blob([jsonString]);

                    // Compress the data using Gzip
                    const compressionStream = new CompressionStream('gzip');
                    const compressedStream = dataBlob.stream().pipeThrough(compressionStream);
                    const compressedBlob = await new Response(compressedStream, { headers: { 'Content-Type': 'application/octet-stream' } }).blob();

                    const url = URL.createObjectURL(compressedBlob);
                    const a = document.createElement('a');
                    const now = new Date();
                    const date = now.toISOString().slice(0, 10);
                    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
                    a.href = url;
                    a.download = `章鱼喷墨_备份数据_${date}_${time}.ee`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    loadingBtn = false
                    showToast('聊天记录导出成功');
                }catch (e){
                    loadingBtn = false
                    showToast(`导出失败, 发生错误: ${e.message}`);
                    console.error('导出错误详情:', e);
                }
            });

            // --- 新增：导入数据按钮 ---
            const importDataBtn = document.createElement('label');
            importDataBtn.className = 'btn btn-neutral';
            importDataBtn.style.fontFamily = 'var(--font-family)';
            importDataBtn.textContent = '导入数据';
            importDataBtn.style.marginTop = '0'; // 按钮行间距由flex gap控制
            importDataBtn.style.display = 'block';
            importDataBtn.disabled = loadingBtn;
            importDataBtn.setAttribute('for', 'import-data-input');
            
            // 移除旧的事件监听器（如果存在），避免重复绑定
            const importInput = document.querySelector('#import-data-input');
            const newImportInput = importInput.cloneNode(true);
            importInput.parentNode.replaceChild(newImportInput, importInput);
            
            newImportInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (!file) return;

                if(confirm('此操作将覆盖当前所有聊天记录和设置。此操作不可撤销。确定要继续吗？')){
                    try {
                        showToast('正在导入数据，请稍候...');

                        // Decompress the file stream
                        const decompressionStream = new DecompressionStream('gzip');
                        const decompressedStream = file.stream().pipeThrough(decompressionStream);
                        const jsonString = await new Response(decompressedStream).text();

                        let data = JSON.parse(jsonString);

                        // 检测数据格式并进行兼容性处理
                        const importResult = await importBackupData(data);

                        if (importResult.success) {
                            showToast(`数据导入成功！${importResult.message} 应用即将刷新。`);
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        } else {
                            showToast(`导入失败: ${importResult.error}`);
                        }
                    } catch (error) {
                        console.error("导入失败:", error);
                        showToast(`解压或解析文件时发生错误: ${error.message}`);
                    } finally {
                        event.target.value = null;
                    }
                }else {
                    event.target.value = null;
                }
            });

            // --- 新增：创建第一行按钮容器 ---
            const buttonRow1 = document.createElement('div');
            buttonRow1.style.display = 'flex';
            buttonRow1.style.gap = '15px'; // 按钮之间的间距
            buttonRow1.style.width = '100%';

            // --- 新增：让按钮在flex布局中平分宽度 ---
            backupDataBtn.style.flex = '1';
            backupDataBtn.style.minWidth = '0'; // 允许按钮缩放
            importDataBtn.style.flex = '1';
            importDataBtn.style.minWidth = '0';
            
            // 将 [备份] 和 [导入] 按钮添加到第一行容器中
            buttonRow1.appendChild(backupDataBtn);
            buttonRow1.appendChild(importDataBtn);

            // 将第一行容器添加到教程区域
            tutorialContentArea.appendChild(buttonRow1);

            // --- 新增：清除缓存并刷新按钮 ---
            const clearCacheBtn = document.createElement('button');
            clearCacheBtn.className = 'btn btn-secondary'; // 使用 btn-secondary (蓝色)
            clearCacheBtn.style.fontFamily = 'var(--font-family)';
            clearCacheBtn.textContent = '清除缓存并刷新';
            clearCacheBtn.style.marginTop = '15px'; // 与导入/备份按钮保持一致的间距
            clearCacheBtn.disabled = loadingBtn; // 与导入/备份按钮共享加载状态

            clearCacheBtn.addEventListener('click', () => {
                if(loadingBtn) {
                    return;
                }
                // 询问用户以防止误触
                if (confirm('这将强制清除本地缓存并刷新页面，以获取最新版本。确定要继续吗？')) {
                    showToast('正在清除缓存并刷新...');
                    // location.reload(true) 是强制刷新页面的关键
                    location.reload(true);
                }
            });
            tutorialContentArea.appendChild(clearCacheBtn);
            // --- 新增结束 ---
        }

        async function exportWorldBooks() {
            try {
                const booksToExport = db.worldBooks;
                if (booksToExport.length === 0) {
                    showToast('没有可导出的世界书。');
                    return;
                }

                const backupData = {
                    type: 'EPhoneWorldBookBackup',
                    version: 1,
                    timestamp: Date.now(),
                    books: booksToExport
                };

                const jsonString = JSON.stringify(backupData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const now = new Date();
                const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
                downloadFile(url, `世界书备份_${dateStr}.json`);
                URL.revokeObjectURL(url);
                showToast('世界书导出成功！');

            } catch (error) {
                showToast(`导出失败: ${error.message}`);
            }
        }

        async function handleWorldBookImport(file) {
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                let booksToImport = [];
                let sourceName = "未知文件";

                if (data.type === 'EPhoneWorldBookBackup' && Array.isArray(data.books)) {
                    booksToImport = data.books;
                    sourceName = "EPhone 备份";
                }
                else if (data.name && data.entries && typeof data.entries === 'object') {
                    sourceName = `TavernAI 世界书: ${data.name}`;
                    const structuredEntries = Object.values(data.entries).map(entry => ({
                        enabled: !entry.disable,
                        keys: entry.key ? entry.key.split(',').map(k => k.trim().toLowerCase()).filter(k => k) : [],
                        comment: entry.comment || '',
                        content: entry.content
                    })).filter(e => e.content);
                    
                    if (structuredEntries.length > 0) {
                        booksToImport.push({
                            id: `wb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            name: `${data.name}的设定集`,
                            content: structuredEntries,
                            position: 'after',
                            category: '设定集'
                        });
                    }
                }
                else if (data.data && data.data.character_book && Array.isArray(data.data.character_book.entries)) {
                    sourceName = `TavernAI 角色卡: ${data.data.name}`;
                    const structuredEntries = data.data.character_book.entries.map(entry => ({
                        enabled: entry.enabled !== undefined ? entry.enabled : true,
                        keys: (entry.keys || []).map(k => k.trim().toLowerCase()).filter(k => k),
                        comment: entry.comment || '',
                        content: entry.content
                    })).filter(e => e.content);

                    if (structuredEntries.length > 0) {
                         booksToImport.push({
                            id: `wb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            name: `${data.data.name}的设定集`,
                            content: structuredEntries,
                            position: 'after',
                            category: '设定集'
                        });
                    }
                }

                if (booksToImport.length === 0) {
                    throw new Error("文件中未找到可识别的世界书条目。");
                }

                if (confirm(`从 ${sourceName} 找到了 ${booksToImport.length} 个世界书条目。\n是否要将它们合并到你现有的世界书中？\n\n(注意：这只会添加新条目，不会覆盖同名条目。)`)) {
                    db.worldBooks.push(...booksToImport.map(book => ({ ...book, id: `wb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` })));
                    await saveData();
                    renderWorldBookList();
                    showToast(`成功导入 ${booksToImport.length} 个条目！`);
                    switchScreen('world-book-screen');
                }

            } catch (error) {
                showToast(`导入失败: ${error.message}`);
            }
        }

        function downloadFile(url, filename) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

    });

