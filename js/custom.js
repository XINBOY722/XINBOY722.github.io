
function TestUrl(url) {
    var Expression = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
    var objExp = new RegExp(Expression);
    if (objExp.test(url) != true) {
        return false;
    }
    return true;
}
function askFriend(event) {
    event.preventDefault();
    
    // 获取表单数据
    let check = $("#friend-check").is(":checked");
    let name = $("#friend-name").val();
    let url = $("#friend-link").val();
    let image = $("#friend-icon").val();
    let des = $("#friend-des").val();

    // 验证表单
    if (!check) {
        showToast('请勾选"我提交的不是无意义信息"', "error");
        return;
    }
    if (!(name && url && image && des)) {
        showToast("信息填写不完整!", "error");
        return;
    }
    if (!TestUrl(url)) {
        showToast("URL格式错误! 需要包含HTTP协议头!", "error");
        return;
    }
    if (!TestUrl(image)) {
        showToast("图片URL格式错误! 需要包含HTTP协议头!", "error");
        return;
    }

    // 显示加载状态
    event.target.classList.add('is-loading');
    // 添加高斯模糊遮罩和加载动画
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <img src="/images/back.gif" alt="加载中">
            <p>loading...</p>
        </div>
    `;
    document.getElementById('friend-modal').appendChild(overlay);
    // 添加淡入动画
    setTimeout(() => overlay.style.opacity = '1', 10);

    // 添加超时处理
    const timeout = setTimeout(() => {
        showToast("请求超时，请稍后重试", "error");
        event.target.classList.remove('is-loading');
        overlay.remove();
    }, 10000);

    // 验证目标URL可访问性 - 使用Image对象绕过跨域限制
    // 验证目标URL可访问性 - 改进版
    const verifyUrl = function(url) {
        return new Promise((resolve, reject) => {
            // 先尝试Image方式
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => {
                // 如果Image方式失败，尝试AJAX HEAD请求
                $.ajax({
                    type: "HEAD",
                    url: url,
                    timeout: 5000
                }).then(() => resolve(true))
                  .catch(() => reject(false));
            };
            img.src = url;
        });
    };

    verifyUrl(url).then(() => {
        clearTimeout(timeout);
        // URL验证通过后执行reCAPTCHA
        grecaptcha.ready(function() {
            grecaptcha.execute('6LeWaQwrAAAAAPMW9HVD140Nxvy6wzSiyIvHJMcK', {
                action: 'submit'
            }).then(function(token) {
                clearTimeout(timeout);
                
                // 提交友链申请
                $.ajax({
                    type: "POST",
                    url: "https://admin.konoxin.top/pub/ask_friend/",
                    data: {
                        name: name,
                        url: url,
                        image: image,
                        description: des,
                        verify: token
                    },
                    dataType: "json",
                    success: function(data) {
                        if (data.status) {
                            showToast(data.msg, "success");
                            // 清空表单
                            $("#friend-name, #friend-link, #friend-icon, #friend-des").val("");
                            $("#friend-check").prop("checked", false);
                        } else {
                            showToast(data.msg || "验证失败", "error");
                        }
                    },
                    error: function() {
                        showToast("提交失败，请稍后重试", "error");
                    },
                    complete: function() {
                        // 确保无论成功失败都移除loading状态和遮罩层
                        event.target.classList.remove('is-loading');
                        document.querySelector('.loading-overlay')?.remove();
                    }
                });
            }).catch(function(error) {
                clearTimeout(timeout);
                showToast("验证失败: " + (error.message || '请完成人机验证'), "error");
                event.target.classList.remove('is-loading');
            });
        });
    }).catch((error) => {
        clearTimeout(timeout);
        document.querySelector('.loading-overlay')?.remove();
        
        let errorMsg = "URL无法连通! ";
        if (error.status === 0) {
            errorMsg += "可能原因：目标网站不支持跨域请求或网络连接失败";
            
        } else if (error.status === 404) {
            errorMsg += "目标页面不存在";
        } else if (error.status === 403) {
            errorMsg += "目标网站拒绝访问";
        } else if (error.status === 500) {
            errorMsg += "目标网站服务器错误";
        } else if (error.status === 503) {
            errorMsg += "目标网站暂时不可用";
        } else {
            // errorMsg += "可能原因：目标网站不支持跨域请求或网络连接失败,但仍可继续提交";
            showToast("警告：目标网站不支持跨域请求或网络连接失败，正在提交......", "warning");
            grecaptcha.ready(function () {
                grecaptcha.execute('6LeWaQwrAAAAAPMW9HVD140Nxvy6wzSiyIvHJMcK', {
                    action: 'submit'
                }).then(function (token) {
                    clearTimeout(timeout);

                    // 提交友链申请
                    $.ajax({
                        type: "POST",
                        url: "https://admin.konoxin.top/pub/ask_friend/",
                        data: {
                            name: name,
                            url: url,
                            image: image,
                            description: des,
                            verify: token
                        },
                        dataType: "json",
                        success: function (data) {
                            if (data.status) {
                                showToast(data.msg, "success");
                                // 清空表单
                                $("#friend-name, #friend-link, #friend-icon, #friend-des").val("");
                                $("#friend-check").prop("checked", false);
                            } else {
                                showToast(data.msg || "验证失败", "error");
                            }
                        },
                        error: function () {
                            showToast("提交失败，请稍后重试", "error");
                        },
                        complete: function () {
                            // 确保无论成功失败都移除loading状态和遮罩层
                            event.target.classList.remove('is-loading');
                            document.querySelector('.loading-overlay')?.remove();
                        }
                    });
                }).catch(function (error) {
                    clearTimeout(timeout);
                    showToast("验证失败: " + (error.message || '请完成人机验证'), "error");
                    event.target.classList.remove('is-loading');
                });
            });
        }
        
        // // 添加留言评论区提示
        // errorMsg += "。如有疑问，请到评论区留言反馈";
        
        // showToast(errorMsg, "error");
        event.target.classList.remove('is-loading');
    });
    
    // 删除下面这行多余的代码
    // img.src = url;  // <-- 这行会导致错误，应该删除
}
// 添加在askFriend函数后面
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("show");
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }, 100);
}
// 将toggleModal函数定义移到文件顶部
function toggleModal() {
    const modal = document.getElementById('friend-modal');
    const backdrop = document.getElementById('modal-backdrop');
    if (modal.style.display === 'block') {
        // 关闭动画
        modal.style.animation = 'modalFadeOut 0.3s forwards';
        backdrop.style.opacity = '0';
        setTimeout(() => {
            modal.style.display = 'none';
            backdrop.style.display = 'none';
            document.body.style.overflow = 'auto';
            modal.style.animation = ''; // 重置动画
        }, 300);
    } else {
        // 打开动画
        modal.style.display = 'block';
        backdrop.style.display = 'block';
        document.body.style.overflow = 'hidden';
        modal.style.animation = 'modalFadeIn 0.3s forwards';
        backdrop.style.opacity = '1';
    }
}

// 在showToast函数后添加CSS样式
const style = document.createElement('style');
style.textContent = `
.toast-notification.toast-warning {
    background-color:rgb(255, 177, 61); /* 黄色背景 */
    color: #fff; /* 深色文字 */
    border: 1px solid #e6b800;
}
.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(44, 44, 44, 0.3);  /* 降低透明度 */
    backdrop-filter: blur(5px);
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 8px;  /* 圆角 */
}
.loading-content {
    text-align: center;
    animation: fadeIn 0.3s ease;
    color: var(--efu-fontcolor);
}
.loading-content img {
    width: 100px;  /* 加大图片尺寸 */
    height: 100px;
}
.loading-content p {
    margin-top: 20px;
    color: var(--efu-fontcolor);
    font-size: 18px;
    font-weight: bold;
    font-family: monospace;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);
