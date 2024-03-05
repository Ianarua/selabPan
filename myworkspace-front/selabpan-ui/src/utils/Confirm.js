import { ElMessageBox } from 'element-plus';

const confirm = (message, func) => {
    ElMessageBox.confirm(message, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
    }).then(() => {
        func();
    }).catch(() => {
    });
};

export default confirm;