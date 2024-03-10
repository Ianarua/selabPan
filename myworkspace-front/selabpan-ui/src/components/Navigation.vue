<template>
    <div class="top-navigation">
        <span v-if="folderList.length === 0" class="all-file">全部文件</span>
    </div>
</template>

<script setup>
import { ref, reactive, getCurrentInstance, nextTick, watch, onMounted } from 'vue';

const {proxy} = getCurrentInstance();
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const props = defineProps({
    watchPath: {
        type: Boolean,
        default: true
    },
    adminShow: {
        type: Boolean,
        default: false
    }
});

// 分类
const category = ref();
// 目录集合
const folderList = ref([]);
// 当前目录
const currentFolder = ref({fileId: '0'});

const init = () => {
    folderList.value = [];
    currentFolder.value = {fileId: '0'};
    doCallback();
};

const emit = defineEmits(['navChange']);
const doCallback = () => {
    emit('navChange', {
        categoryId: category.value,
        curFolder: currentFolder.value
    });
};

watch(
    () => route,
    (newVal, oldVal) => {
        if (!props.watchPath) {
            return;
        }
        if (newVal.path.indexOf('/main') === -1 &&
            newVal.path.indexOf('/share') === -1
        ) {
            return;
        }
        const path = newVal.query.path;
        category.value = newVal.params.category;
        if (path === undefined) {
            init();
        } else {
            let pathArray = path.split('/');
            currentFolder.value = {
                fileId: pathArray[pathArray.length - 1]
            };
            doCallback();
        }
    },
    {immediate: true, deep: true}
);
onMounted(() => init());
</script>

<style lang="scss" scoped>
.top-navigation {
    font-size: 13px;
    display: flex;
    align-items: center;
    line-height: 40px;

    .all-file {
        font-weight: bold;
    }
}
</style>
