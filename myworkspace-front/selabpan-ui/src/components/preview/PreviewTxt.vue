<template>
    <div class="code">
        <div class="top-op">
            <div class="encode-select">
                <!-- 下拉框 -->
                <el-select
                    clearable
                    placeholder="选择编码"
                    v-model="encode"
                    @change="showTxt"
                >
                    <el-option value="utf8" label="utf8编码"/>
                    <el-option value="gbk" label="gbk编码"/>
                </el-select>
            </div>
            <div class="copy-btn">
                <el-button type="primary" @click="copy">复制</el-button>
            </div>
        </div>
        <highlightjs autodetect :code="txtContent"/>
    </div>
</template>

<script setup>
import useClipboard from 'vue-clipboard3';
import { getCurrentInstance, onMounted, ref } from 'vue';

const {toClipboard} = useClipboard();

const {proxy} = getCurrentInstance();

const props = defineProps({
    url: {
        type: String
    }
});

const txtContent = ref('');
const blobResult = ref();
const encode = ref('utf8');
const readTxt = async () => {
    let result = await proxy.Request({
        url: props.url,
        responseType: 'blob'
    });
    if (!result) {
        return;
    }
    blobResult.value = result;
    showTxt();
};

const showTxt = () => {
    const reader = new FileReader();
    reader.onload = () => {
        txtContent.value = reader.result;
    };
    reader.readAsText(blobResult.value, encode.value);
};

onMounted(() => {
    readTxt();
});

const copy = async () => {
    await toClipboard(txtContent.value);
    proxy.Message.success('复制成功');
};
</script>

<style lang="scss" scoped>
.code {
    width: 100%;

    .top-op {
        display: flex;
        align-items: center;
        justify-content: space-around;
    }

    .encode-select {
        flex: 1;
        display: flex;
        align-items: center;
        margin: 5px 10px;
    }

    .copy-btn {
        margin-right: 10px;
    }

    pre {
        margin: 0;
    }
}
</style>
