// MessageManager.js - Quản lý tin nhắn

export class MessageManager {
    constructor(chatApp) {
        this.chatApp = chatApp;
        this.messageTemplates = {
            text: null,
            file: null,
            system: null
        };
        
        // Set lưu trữ ID của các tin nhắn đã hiển thị
        this.displayedMessageIds = new Set();
        
        // Khởi tạo các template tin nhắn
        this.initMessageTemplates();
    }
    
    /**
     * Khởi tạo các template tin nhắn
     */
    initMessageTemplates() {
        // Template tin nhắn văn bản
        this.messageTemplates.text = `
            <div class="message-avatar">
                <img src="{{avatar}}" alt="Avatar">
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="sender-name">{{senderName}}</span>
                    <span class="time">{{time}}</span>
                </div>
                <div class="message-text">{{content}}</div>
            </div>
        `;
        
        // Template tin nhắn file
        this.messageTemplates.file = `
            <div class="message-avatar">
                <img src="{{avatar}}" alt="Avatar">
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="sender-name">{{senderName}}</span>
                    <span class="time">{{time}}</span>
                </div>
                <div class="file-message">
                    <div class="file-icon"><i class="{{fileIcon}}"></i></div>
                    <div class="file-info">
                        <div class="file-name">{{fileName}}</div>
                        <div class="file-size">{{fileSize}}</div>
                    </div>
                    <a href="{{fileUrl}}" class="file-download" download="{{fileName}}">
                        <i class="fas fa-download"></i>
                    </a>
                </div>
                {{#isImage}}
                <div class="image-preview">
                    <img src="{{fileUrl}}" alt="{{fileName}}" onclick="window.customerChat.messageManager.showImageModal('{{fileUrl}}')">
                </div>
                {{/isImage}}
            </div>
        `;
        
        // Template tin nhắn hệ thống
        this.messageTemplates.system = `
            <div class="system-message">
                <div class="system-icon"><i class="fas fa-info-circle"></i></div>
                <div class="system-content">{{content}}</div>
            </div>
        `;
    }
    
    /**
     * Lấy hoặc tạo container tin nhắn
     */
    getOrCreateMessagesContainer() {
        let messagesContainer = document.getElementById('messages-container');
        
        if (!messagesContainer) {
            const chatContent = this.chatApp.ui.elements.chatContent;
            messagesContainer = document.createElement('div');
            messagesContainer.className = 'messages';
            messagesContainer.id = 'messages-container';
            chatContent.appendChild(messagesContainer);
        }
        
        return messagesContainer;
    }
    
    /**
     * Hiển thị tin nhắn
     */
    displayMessage(message) {
 
        
        // Lấy container cho tin nhắn
        const messagesContainer = this.getOrCreateMessagesContainer();
        
        // Tạo phần tử tin nhắn
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        // Thêm class dựa trên loại người gửi
        if (message.sender === 'customer' || message.sender_type === 'customer') {
            messageElement.classList.add('customer');
        } else if (message.sender === 'system' || message.sender_type === 'system') {
            messageElement.classList.add('system');
        } else {
            messageElement.classList.add('admin');
        }
        
        // Thêm class nếu là tin nhắn tạm thời
        if (message.isTemp) {
            messageElement.classList.add('temp-message');
            messageElement.setAttribute('data-temp', 'true');
        }
        
        // Đặt ID cho tin nhắn
        if (message.id) {
            messageElement.setAttribute('data-id', message.id);
            
            // Thêm ID vào Set để tránh hiển thị lại
            if (!message.isTemp) {
                this.displayedMessageIds.add(message.id);
            }
        }
        
        // Xử lý nội dung tin nhắn
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        // Xử lý nội dung tin nhắn (thêm liên kết, emoji, v.v.)
        const processedContent = this.processMessageContent(message.content || '');
        messageText.innerHTML = processedContent;
        
        // Thêm thời gian
        const timeElement = document.createElement('div');
        timeElement.className = 'time';
        
        try {
            timeElement.textContent = this.formatTime(message.createdAt || message.created_at || new Date());
        } catch (error) {
            console.error('Lỗi khi định dạng thời gian:', error);
            timeElement.textContent = 'Vừa xong';
        }
        
        // Thêm nội dung vào tin nhắn
        messageElement.appendChild(messageText);
        messageElement.appendChild(timeElement);
        
        // Thêm tin nhắn vào container
        messagesContainer.appendChild(messageElement);
        
        // Cuộn xuống dưới
        this.scrollToBottom();
    }
    
    /**
     * Xử lý nội dung tin nhắn
     */
    processMessageContent(content) {
        if (!content) return '';
        
        // Chuyển đổi URL thành liên kết
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        content = content.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
        
        // Chuyển đổi xuống dòng thành thẻ <br>
        content = content.replace(/\n/g, '<br>');
        
        return content;
    }
    
    /**
     * Hiển thị tin nhắn hệ thống
     */
    displaySystemMessage(content) {
        this.displayMessage({
            content,
            sender: 'system',
            sender_type: 'system',
            type: 'text',
            createdAt: new Date()
        });
    }
    
    /**
     * Định dạng thời gian
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        
        // Định dạng giờ:phút AM/PM
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours ? hours : 12; // Chuyển 0 thành 12
        
        return `${hours}:${minutes} ${ampm}`;
    }
    
    /**
     * Cuộn xuống dưới cùng
     */
    scrollToBottom() {
        const messagesContainer = this.getOrCreateMessagesContainer();
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    /**
     * Xử lý tin nhắn mới
     */
    handleNewMessage(message) {
        
        // Kiểm tra xem tin nhắn có ID không
        if (!message.id) {
            this.displayMessage(message);
            return;
        }
        
        // Kiểm tra xem tin nhắn đã được hiển thị chưa
        if (this.displayedMessageIds.has(message.id)) {
            return;
        }
        
        // Kiểm tra xem tin nhắn có phải từ khách hàng không
        const isFromCustomer = message.sender === 'customer' || message.sender_type === 'customer';
        
        // Kiểm tra xem tin nhắn đã tồn tại trong DOM chưa
        const messagesContainer = this.getOrCreateMessagesContainer();
        const existsInDOM = messagesContainer.querySelector(`.message[data-id="${message.id}"]`);
        
        if (existsInDOM) {
            return;
        }
        
        // Hiển thị tin nhắn
        this.displayMessage(message);
        
        // Nếu không phải tin nhắn từ khách hàng và không đang xem phòng chat, tăng số tin nhắn chưa đọc
        if (!isFromCustomer && this.chatApp.currentRoomId !== message.room_id) {
            this.chatApp.increaseUnreadCount(message.room_id);
        }
        
        // Phát âm thanh thông báo nếu không phải tin nhắn từ khách hàng
        if (!isFromCustomer) {
            this.playNotificationSound();
        }
    }
    
    /**
     * Phát âm thanh thông báo
     */
    playNotificationSound() {
        try {
            const audio = new Audio('sounds/notification.mp3');
            audio.volume = 0.5;
            audio.play();
        } catch (error) {
            console.error('Không thể phát âm thanh thông báo:', error);
        }
    }
    
    /**
     * Hiển thị modal hình ảnh
     */
    showImageModal(src) {
        // Kiểm tra xem đã có modal chưa
        let modal = document.getElementById('image-modal');
        
        if (!modal) {
            // Tạo modal
            modal = document.createElement('div');
            modal.id = 'image-modal';
            modal.className = 'image-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <img src="" alt="Hình ảnh đầy đủ">
                </div>
            `;
            document.body.appendChild(modal);
            
            // Thêm sự kiện đóng modal
            modal.querySelector('.close-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            // Thêm sự kiện click bên ngoài để đóng modal
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Cập nhật src cho hình ảnh
        modal.querySelector('img').src = src;
        
        // Hiển thị modal
        modal.style.display = 'flex';
    }
} 