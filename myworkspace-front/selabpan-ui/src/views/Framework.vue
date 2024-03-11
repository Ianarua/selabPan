<template>
    <div class="framework">
        <div class="header">
            <div class="logo">
                <div class="name">Selab云盘</div>
            </div>
            <div class="right-panel">
                <!-- 任务栏 -->
                <el-popover
                    :width="800"
                    trigger="click"
                    v-model:visible="showUploader"
                    :offset="20"
                    transition="none"
                    :hide-after="0"
                    :popper-style="{ padding: '0px' }"
                >
                    <template #reference>
                        <span class="iconfont icon-transfer"/>
                    </template>
                    <template #default>
                        <Uploader
                            ref="uploaderRef"
                            @uploadCallback="uploadCallbackHandler"
                        />
                    </template>
                </el-popover>

                <!-- 头像下拉框 -->
                <el-dropdown>
                    <div class="user-info">
                        <div class="avatar">
                            <Avatar
                                :userId="userInfo.userId"
                                :avatar="userInfo.avatar"
                                :timestamp="timestamp"
                                :width="46"
                            />
                        </div>
                        <span class="nick-name">{{ userInfo.nickName }}</span>
                    </div>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item @click="updateAvatar">
                                修改头像
                            </el-dropdown-item>
                            <el-dropdown-item @click="updatePassword">
                                修改密码
                            </el-dropdown-item>
                            <el-dropdown-item @click="logout">退出</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
        <div class="body">
            <div class="left-sider">
                <div class="menu-list">
                    <template v-for="item in menus">
                        <div
                            v-if="item.allShow || (!item.allShow && userInfo.admin)"
                            @click="jump(item)"
                            :class="[
                                'menu-item',
                                item.menuCode === currentMenu.menuCode ? 'active' : '',     // 判断当前选择的哪个
                            ]"
                        >
                            <div :class="['iconfont', 'icon-' + item.icon]"/>
                            <div class="text">{{ item.name }}</div>
                        </div>
                    </template>
                </div>
                <div class="menu-child-list">
                    <div
                        v-for="child in currentMenu.children"
                        @click="jump(child)"
                        :class="['menu-item-child', currentPath === child.path ? 'active' : '']"
                    >
                        <span :class="['iconfont', 'icon-' + child.icon]" v-if="child.icon"/>
                        <span class="text">{{ child.name }}</span>
                    </div>
                    <div class="space-info">
                        <div>空间使用</div>
                        <div class="percent">
                            <el-progress
                                :percentage="Math.floor((useSpaceInfo.useSpace / useSpaceInfo.totalSpace) * 10000) / 100"
                                color="#f701ff"
                            />
                        </div>
                        <div class="space-use">
                            <div class="use">
                                {{ proxy.Utils.size2Str(useSpaceInfo.useSpace) }} / {{
                                    proxy.Utils.size2Str(useSpaceInfo.totalSpace)
                                }}
                            </div>
                            <div class="iconfont icon-refresh" @click="getUseSpace"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="body-content">
                <router-view v-slot="{ Component }">
                    <component
                        ref="routerViewRef"
                        :is="Component"
                        @addFile="addFile"
                        @reload="getUseSpace"
                    />
                </router-view>
            </div>
        </div>
        <!-- 修改头像 -->
        <UpdateAvatar
            ref="updateAvatarRef"
            @updateAvatar="reloadAvatar">
        </UpdateAvatar>
        <!-- 修改密码 -->
        <UpdatePassword ref="updatePasswordRef"/>
    </div>
</template>

<script setup>
import Uploader from '@/views/main/Uploader.vue';
import UpdateAvatar from './UpdateAvatar.vue';
import UpdatePassword from './UpdatePassword.vue';

import { ref, reactive, getCurrentInstance, nextTick, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const {proxy} = getCurrentInstance();
const router = useRouter();
const route = useRoute();

const api = {
    logout: '/logout',
    getUseSpace: '/getUseSpace'
};

//显示上传窗口
const showUploader = ref(false);

// 添加文件
const uploaderRef = ref();
const addFile = (data) => {
    const {file, filePid} = data;
    showUploader.value = true;
    uploaderRef.value.addFile(file, filePid);
};

// 上传文件回调
const routerViewRef = ref();
const uploadCallbackHandler = () => {
    nextTick(() => {
        console.log(routerViewRef.value);
        routerViewRef.value.reload();
        getUseSpace();
    });
};
const timestamp = ref(0);
// 获取用户信息
const userInfo = ref(proxy.VueCookies.get('userInfo'));

const menus = [
    {
        icon: 'cloude',
        name: '首页',
        menuCode: 'main',
        path: '/main/all',
        allShow: true,
        children: [
            {
                icon: 'all',
                name: '全部',
                category: 'all',
                path: '/main/all'
            },
            {
                icon: 'video',
                name: '视频',
                category: 'video',
                path: '/main/video'
            },
            {
                icon: 'music',
                name: '音频',
                category: 'music',
                path: '/main/music'
            },
            {
                icon: 'image',
                name: '图片',
                category: 'image',
                path: '/main/image'
            },
            {
                icon: 'doc',
                name: '文档',
                category: 'doc',
                path: '/main/doc'
            },
            {
                icon: 'more',
                name: '其他',
                category: 'others',
                path: '/main/others'
            }
        ]
    },
    {
        path: '/myshare',
        icon: 'share',
        name: '分享',
        menuCode: 'share',
        allShow: true,
        children: [
            {
                name: '分享记录',
                path: '/myshare'
            }
        ]
    },
    {
        path: '/recycle',
        icon: 'del',
        name: '回收站',
        menuCode: 'recycle',
        allShow: true,
        children: [
            {
                name: '删除的文件',
                path: '/recycle'
            }
        ]
    }
];

const currentMenu = ref({});
const currentPath = ref();
const jump = (data) => {
    if (!data.path || data.menuCode === currentMenu.value.menuCode) {
        return;
    }
    router.push(data.path);
};

const setMenu = (menuCode, path) => {
    const menu = menus.find((item) => {
        return item.menuCode === menuCode;
    });
    currentMenu.value = menu;
    currentPath.value = path;
};
watch(
    () => route,
    (newVal, oldVal) => {
        if (newVal.meta.menuCode) {
            setMenu(newVal.meta.menuCode, newVal.path);
        }
    },
    {immediate: true, deep: true}
);

// 修改头像
const updateAvatarRef = ref();
const updateAvatar = () => {
    updateAvatarRef.value.show(userInfo.value);
};

const reloadAvatar = () => {
    userInfo.value = proxy.VueCookies.get('userInfo');
    timestamp.value = new Date().getTime();
};

// 修改密码
const updatePasswordRef = ref();
const updatePassword = () => {
    updatePasswordRef.value.show();
};

// 退出
const logout = async () => {
    proxy.Confirm(`你确定要退出吗`, async () => {
        let result = await proxy.Request({
            url: api.logout
        });
        if (!result) {
            return;
        }
        proxy.VueCookies.remove('userInfo');
        await router.push('/login');
    });
};

// 使用空间
const useSpaceInfo = ref({useSpace: 0, totalSpace: 1});
const getUseSpace = async () => {
    let result = await proxy.Request({
        url: api.getUseSpace,
        showLoading: false
    });
    if (!result) {
        return;
    }
    useSpaceInfo.value = result.data;
};

onMounted(() => {
    getUseSpace();
});
</script>

<style lang="scss" scoped>
.header {
    box-shadow: 0 3px 10px 0 rgb(0 0 0 / 6%);
    height: 56px;
    padding-left: 24px;
    padding-right: 24px;
    position: relative;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .logo {
        display: flex;
        align-items: center;

        .name {
            font-weight: bold;
            margin-left: 5px;
            font-size: 25px;
            color: #f701ff;
            letter-spacing: 1px;
            animation-name: glitched;
            animation-duration: calc(.9s * 3.4);
            animation-iteration-count: infinite;
            animation-timing-function: linear;
            @keyframes glitched {
                0% {
                    left: -4px;
                    transform: skew(-20deg);
                }
                11% {
                    left: 2px;
                    transform: skew(0deg);
                }
                50% {
                    transform: skew(0deg);
                }
                51% {
                    transform: skew(10deg);
                }
                60% {
                    transform: skew(0deg);
                }
                100% {
                    transform: skew(0deg);
                }
            }
        }
    }

    .right-panel {
        display: flex;
        align-items: center;

        .icon-transfer {
            cursor: pointer;
        }

        .user-info {
            margin-left: 10px;
            display: flex;
            align-items: center;
            cursor: pointer;

            .avatar {
                margin: 0px 5px 0px 15px;
            }

            .nick-name {
                color: #f701ff;
                animation-name: glitched;
                animation-duration: calc(.9s * 3.4);
                animation-iteration-count: infinite;
                animation-timing-function: linear;
                @keyframes glitched {
                    0% {
                        left: -4px;
                        transform: skew(-20deg);
                    }
                    11% {
                        left: 2px;
                        transform: skew(0deg);
                    }
                    50% {
                        transform: skew(0deg);
                    }
                    51% {
                        transform: skew(10deg);
                    }
                    60% {
                        transform: skew(0deg);
                    }
                    100% {
                        transform: skew(0deg);
                    }
                }
            }
        }
    }
}

.body {
    display: flex;

    .left-sider {
        border-right: 1px solid #f1f2f4;
        display: flex;

        .menu-list {
            height: calc(100vh - 56px);
            width: 80px;
            box-shadow: 0 3px 10px 0 rgb(0 0 0 /6%);
            border-right: 1px solid #f1f2f4;

            .menu-item {
                text-align: center;
                font-size: 14px;
                font-weight: bold;
                padding: 20px 0px;
                cursor: pointer;

                &:hover {
                    background: #f3f3f3;
                }

                .iconfont {
                    font-weight: normal;
                    font-size: 28px;
                }
            }

            .active {
                .iconfont {
                    color: #f701ff;
                }

                .text {
                    color: #f701ff;
                }
            }
        }

        .menu-child-list {
            width: 200px;
            padding: 20px 10px 0px;
            position: relative;

            .menu-item-child {
                text-align: center;
                line-height: 40px;
                border-radius: 5px;
                cursor: pointer;

                &:hover {
                    background: #f3f3f3;
                }

                .iconfont {
                    font-size: 14px;
                    margin-right: 20px;
                }

                .text {
                    font-size: 13px;
                }
            }

            .active {
                background: #eef9fe;

                .iconfont {
                    color: #f701ff;
                }

                .text {
                    color: #f701ff;
                }
            }

            .space-info {
                position: absolute;
                bottom: 10px;
                width: 100%;
                padding: 0px 5px;

                .percent {
                    padding-right: 10px;
                }

                .space-use {
                    margin-top: 5px;
                    color: #7e7e7e;
                    display: flex;
                    justify-content: space-around;

                    .use {
                        flex: 1;
                    }

                    .iconfont {
                        cursor: pointer;
                        margin-right: 20px;
                        color: #f701ff;
                    }
                }
            }
        }
    }

    .body-content {
        flex: 1;
        width: 0;
        padding-left: 20px;
    }
}
</style>
