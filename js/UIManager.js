// UIManager.js - Quản lý giao diện người dùng

export class UIManager {
    constructor(chatApp) {
        this.chatApp = chatApp;
        this.elements = {
            container: null,
            chatBubble: null,
            notificationBadge: null,
            chatWindow: null,
            chatHeader: null,
            chatContent: null,
            chatInput: null,
            backBtn: null
        };
    }
    
    /**
     * Khởi tạo giao diện chat
     */
    initUI() {
        // Tạo container chính
        const container = document.getElementById('chat-container');
        this.elements.container = container;
        
        // Tạo bong bóng chat
        const chatBubble = document.createElement('div');
        chatBubble.className = 'chat-bubble';
        chatBubble.innerHTML = '<i class="fas fa-comments"></i>';
        chatBubble.addEventListener('click', () => this.toggleChatWindow());
        container.appendChild(chatBubble);
        this.elements.chatBubble = chatBubble;
        
        // Thêm badge thông báo
        const notificationBadge = document.createElement('div');
        notificationBadge.className = 'notification-badge';
        notificationBadge.style.display = 'none';
        notificationBadge.textContent = '0';
        chatBubble.appendChild(notificationBadge);
        this.elements.notificationBadge = notificationBadge;
        
        // Tạo cửa sổ chat
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window';
        container.appendChild(chatWindow);
        this.elements.chatWindow = chatWindow;
        
        // Tạo header
        const chatHeader = document.createElement('div');
        chatHeader.className = 'chat-header';
        chatHeader.innerHTML = `
            <button class="back-btn"><i class="fas fa-arrow-left"></i></button>
            <img class="logo" src="images/admin.png" alt="Logo">
            <div class="title">Chat Hỗ Trợ</div>
            <button class="close-btn"><i class="fas fa-times"></i></button>
        `;
        chatWindow.appendChild(chatHeader);
        this.elements.chatHeader = chatHeader;
        
        // Thêm sự kiện cho nút đóng
        chatHeader.querySelector('.close-btn').addEventListener('click', () => this.toggleChatWindow(false));
        
        // Thêm sự kiện cho nút quay lại
        const backBtn = chatHeader.querySelector('.back-btn');
        backBtn.addEventListener('click', () => this.navigateBack());
        this.elements.backBtn = backBtn;
        
        // Tạo phần nội dung
        const chatContent = document.createElement('div');
        chatContent.className = 'chat-content';
        chatWindow.appendChild(chatContent);
        this.elements.chatContent = chatContent;
        
        // Tạo phần nhập liệu
        const chatInput = document.createElement('div');
        chatInput.className = 'chat-input';
        chatInput.innerHTML = `
            <label class="attachment-btn">
                <i class="fas fa-paperclip"></i>
                <input type="file" id="file-input">
            </label>
            <input type="text" placeholder="Nhập tin nhắn...">
            <button><i class="fas fa-paper-plane"></i></button>
        `;
        chatWindow.appendChild(chatInput);
        this.elements.chatInput = chatInput;
        
        // Thêm sự kiện cho nút gửi
        chatInput.querySelector('button').addEventListener('click', () => this.chatApp.sendMessage());
        
        // Thêm sự kiện cho input
        chatInput.querySelector('input[type="text"]').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.chatApp.sendMessage();
            }
        });
        
        // Thêm sự kiện cho input file
        chatInput.querySelector('input[type="file"]').addEventListener('change', (e) => {
            this.chatApp.handleFileUpload(e);
        });
        
        // Tải Font Awesome
        this.loadFontAwesome();
        
        // Hiển thị màn hình chào mừng
        this.showWelcomeScreen();
    }
    
    /**
     * Bật/tắt cửa sổ chat
     */
    toggleChatWindow(show = null) {
        const chatWindow = this.elements.chatWindow;
        
        if (show === null) {
            // Toggle
            chatWindow.classList.toggle('active');
        } else if (show) {
            // Hiển thị
            chatWindow.classList.add('active');
        } else {
            // Ẩn
            chatWindow.classList.remove('active');
        }
    }
    
    /**
     * Quay lại màn hình trước
     */
    navigateBack() {
        // Xác định màn hình hiện tại và quay lại màn hình trước đó
        switch (this.chatApp.currentView) {
            case 'direct-chat':
            case 'chat-room':
            case 'room-list':
                this.showWelcomeScreen();
                break;
            case 'public-rooms':
                this.showWelcomeScreen();
                break;
            case 'public-chat':
                // Thay vì rời phòng, chỉ quay lại màn hình danh sách phòng chat công khai
                this.chatApp.showPublicRooms();
                break;
            case 'register':
                this.showWelcomeScreen();
                break;
            default:
                this.showWelcomeScreen();
                break;
        }
    }
    
    /**
     * Tải Font Awesome
     */
    loadFontAwesome() {
        if (!document.getElementById('fontawesome-css')) {
            const link = document.createElement('link');
            link.id = 'fontawesome-css';
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
            document.head.appendChild(link);
        }
    }
    
    /**
     * Hiển thị màn hình chào mừng
     */
    showWelcomeScreen() {
        const { chatContent, backBtn, chatInput } = this.elements;
        
        // Ẩn nút quay lại
        backBtn.style.display = 'none';
        
        // Ẩn phần nhập liệu
        chatInput.style.display = 'none';
        
        // Xóa nội dung cũ
        chatContent.innerHTML = '';
        
        // Tạo nội dung chào mừng
        const welcomeContent = document.createElement('div');
        welcomeContent.className = 'welcome-screen';
        
        // Tạo phần chào mừng
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'welcome-message';
        welcomeMessage.innerHTML = `
            <h2>Chào mừng bạn!</h2>
            <p>Chúng tôi có thể giúp gì cho bạn hôm nay?</p>
        `;
        
        // Tạo các nút tùy chọn
        const optionButtons = document.createElement('div');
        optionButtons.className = 'option-buttons';
        
        // Nút chat với nhân viên hỗ trợ
        const supportChatButton = document.createElement('div');
        supportChatButton.className = 'option-button';
        supportChatButton.innerHTML = `
            <div class="option-icon"><i class="fas fa-headset"></i></div>
            <div class="option-text">Chat với nhân viên hỗ trợ</div>
        `;
        supportChatButton.addEventListener('click', () => {
            if (this.chatApp.isRegistered) {
                this.chatApp.startDirectChat();
            } else {
                this.showRegistrationForm('direct');
            }
        });
        
        // Nút tham gia phòng chat
        const publicChatButton = document.createElement('div');
        publicChatButton.className = 'option-button';
        publicChatButton.innerHTML = `
            <div class="option-icon"><i class="fas fa-users"></i></div>
            <div class="option-text">Tham gia phòng chat</div>
        `;
        publicChatButton.addEventListener('click', () => {
            if (this.chatApp.isRegistered) {
                this.chatApp.showPublicRooms();
            } else {
                this.showRegistrationForm('public');
            }
        });
        
        // Nút đăng xuất
        const logoutButton = document.createElement('div');
        logoutButton.className = 'option-button logout-button';
        logoutButton.innerHTML = `
            <div class="option-icon"><i class="fas fa-sign-out-alt"></i></div>
            <div class="option-text">Đăng xuất</div>
        `;
        logoutButton.addEventListener('click', () => {
            if (confirm('Bạn có chắc muốn đăng xuất? Thông tin đăng nhập sẽ bị xóa.')) {
                this.chatApp.storage.clearStoredCustomerInfo();
                this.showWelcomeScreen();
            }
        });
        
        // Thêm các nút vào container
        optionButtons.appendChild(supportChatButton);
        optionButtons.appendChild(publicChatButton);
        optionButtons.appendChild(logoutButton);
        
        // Thêm các phần tử vào màn hình chào mừng
        welcomeContent.appendChild(welcomeMessage);
        welcomeContent.appendChild(optionButtons);
        
        // Thêm nội dung vào chatContent
        chatContent.appendChild(welcomeContent);
        
        // Cập nhật view hiện tại
        this.chatApp.currentView = 'welcome';
        
        // Hiển thị nút đăng xuất nếu đã đăng nhập
        if (this.chatApp.isRegistered) {
            logoutButton.style.display = 'flex';
        } else {
            logoutButton.style.display = 'none';
        }
    }
    
    /**
     * Thêm nút xóa thông tin đăng nhập
     */
    addClearLoginButton() {
        const welcomeScreen = this.elements.chatContent.querySelector('.welcome-screen');
        if (!welcomeScreen) return;
        
        // Kiểm tra xem đã có nút chưa
        if (welcomeScreen.querySelector('.clear-login-btn')) return;
        
        // Tạo nút xóa thông tin
        const clearBtn = document.createElement('button');
        clearBtn.className = 'clear-login-btn';
        clearBtn.innerHTML = 'Đăng xuất <i class="fas fa-sign-out-alt"></i>';
        clearBtn.addEventListener('click', () => {
            // Hiển thị xác nhận
            if (confirm('Bạn có chắc muốn đăng xuất? Thông tin đăng nhập sẽ bị xóa.')) {
                this.chatApp.storage.clearStoredCustomerInfo();
                this.showWelcomeScreen();
            }
        });
        
        // Thêm nút vào màn hình chào mừng
        welcomeScreen.appendChild(clearBtn);
    }
    
    /**
     * Hiển thị form đăng ký
     */
    showRegistrationForm(nextAction = 'direct') {
        const { chatContent, backBtn } = this.elements;
        
        // Hiển thị nút quay lại
        backBtn.style.display = 'block';
        
        // Xóa nội dung cũ
        chatContent.innerHTML = '';
        
        // Tạo form đăng ký
        const registrationForm = document.createElement('div');
        registrationForm.className = 'registration-form';
        registrationForm.innerHTML = `
            <h2>Thông tin của bạn</h2>
            <p>Vui lòng cung cấp thông tin để chúng tôi có thể hỗ trợ bạn tốt hơn</p>
            <form>
                <div class="form-group">
                    <label for="name">Họ tên *</label>
                    <input type="text" id="name" required>
                </div>
                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="phone">Số điện thoại *</label>
                    <input type="tel" id="phone" required>
                </div>
                <button type="submit" class="submit-btn">Bắt đầu chat</button>
            </form>
        `;
        
        // Thêm sự kiện submit form
        registrationForm.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Lấy thông tin từ form
            const name = registrationForm.querySelector('#name').value.trim();
            const email = registrationForm.querySelector('#email').value.trim();
            const phone = registrationForm.querySelector('#phone').value.trim();
            
            // Kiểm tra thông tin
            if (!name || !email || !phone) {
                this.chatApp.notification.showNotification('Vui lòng điền đầy đủ thông tin bắt buộc.', 'error');
                return;
            }
            
            // Đăng ký thông tin khách hàng
            this.chatApp.registerCustomer({
                name,
                email,
                phone,
                nextAction
            });
        });
        
        // Thêm form vào chatContent
        chatContent.appendChild(registrationForm);
        
        // Cập nhật view hiện tại
        this.chatApp.currentView = 'register';
    }
    
    /**
     * Yêu cầu cập nhật thông tin
     */
    requestInfoUpdate(nextAction = 'direct') {
        const { chatContent, backBtn } = this.elements;
        
        // Hiển thị nút quay lại
        backBtn.style.display = 'block';
        
        // Xóa nội dung cũ
        chatContent.innerHTML = '';
        
        // Tạo form cập nhật thông tin
        const updateForm = document.createElement('div');
        updateForm.className = 'registration-form';
        updateForm.innerHTML = `
            <h2>Cập nhật thông tin</h2>
            <p>Vui lòng cập nhật đầy đủ thông tin để chúng tôi có thể hỗ trợ bạn tốt hơn</p>
            <form>
                <div class="form-group">
                    <label for="name">Họ tên *</label>
                    <input type="text" id="name" value="${this.chatApp.customerInfo?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" value="${this.chatApp.customerInfo?.email || ''}" required>
                </div>
                <div class="form-group">
                    <label for="phone">Số điện thoại *</label>
                    <input type="tel" id="phone" value="${this.chatApp.customerInfo?.phone || ''}" required>
                </div>
                <button type="submit" class="submit-btn">Cập nhật và tiếp tục</button>
            </form>
        `;
        
        // Thêm sự kiện submit form
        updateForm.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Lấy thông tin từ form
            const name = updateForm.querySelector('#name').value.trim();
            const email = updateForm.querySelector('#email').value.trim();
            const phone = updateForm.querySelector('#phone').value.trim();
            
            // Kiểm tra thông tin
            if (!name || !email || !phone) {
                this.chatApp.notification.showNotification('Vui lòng điền đầy đủ thông tin bắt buộc.', 'error');
                return;
            }
            
            // Cập nhật thông tin khách hàng
            this.chatApp.updateCustomerInfo({
                name,
                email,
                phone,
                nextAction
            });
        });
        
        // Thêm form vào chatContent
        chatContent.appendChild(updateForm);
        
        // Cập nhật view hiện tại
        this.chatApp.currentView = 'register';
    }
    
    /**
     * Hiển thị giao diện chat trực tiếp
     */
    showDirectChatUI() {
        const { chatContent, backBtn, chatInput } = this.elements;
        
        // Hiển thị nút quay lại
        backBtn.style.display = 'block';
        
        // Xóa nội dung cũ
        chatContent.innerHTML = '';
        
        // Tạo container cho tin nhắn
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'messages';
        chatContent.appendChild(messagesContainer);
        
        // Hiển thị phần nhập liệu
        chatInput.style.display = 'flex';
        
        // Cập nhật view hiện tại
        this.chatApp.currentView = 'direct-chat';
    }
    
    /**
     * Hiển thị danh sách phòng chat
     */
    showRoomSelection() {
        const { chatContent, backBtn, chatInput } = this.elements;
        
        // Hiển thị nút quay lại
        backBtn.style.display = 'block';
        
        // Ẩn phần nhập liệu
        chatInput.style.display = 'none';
        
        // Xóa nội dung cũ
        chatContent.innerHTML = '';
        
        // Tạo container cho danh sách phòng
        const roomSelectionContainer = document.createElement('div');
        roomSelectionContainer.className = 'room-selection';
        roomSelectionContainer.innerHTML = `
            <h2>Chọn phòng chat</h2>
            <div class="room-tabs">
                <button class="tab-btn active" data-tab="joined">Đã tham gia</button>
                <button class="tab-btn" data-tab="available">Có sẵn</button>
            </div>
            <div class="room-list-container">
                <div class="room-list joined-rooms active"></div>
                <div class="room-list available-rooms"></div>
            </div>
            <button class="direct-chat-btn">Chat trực tiếp với nhân viên</button>
        `;
        
        // Thêm sự kiện cho các tab
        const tabBtns = roomSelectionContainer.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Xóa active class từ tất cả các tab
                tabBtns.forEach(b => b.classList.remove('active'));
                
                // Thêm active class cho tab được chọn
                btn.classList.add('active');
                
                // Ẩn tất cả các danh sách phòng
                const roomLists = roomSelectionContainer.querySelectorAll('.room-list');
                roomLists.forEach(list => list.classList.remove('active'));
                
                // Hiển thị danh sách phòng tương ứng
                const tabName = btn.getAttribute('data-tab');
                roomSelectionContainer.querySelector(`.${tabName}-rooms`).classList.add('active');
                
                // Tải danh sách phòng
                if (tabName === 'joined') {
                    this.showJoinedRooms();
                } else {
                    this.showAvailableRooms();
                }
            });
        });
        
        // Thêm sự kiện cho nút chat trực tiếp
        roomSelectionContainer.querySelector('.direct-chat-btn').addEventListener('click', () => {
            this.chatApp.startDirectChat();
        });
        
        // Thêm container vào chatContent
        chatContent.appendChild(roomSelectionContainer);
        
        // Hiển thị danh sách phòng đã tham gia
        this.showJoinedRooms();
        
        // Cập nhật view hiện tại
        this.chatApp.currentView = 'room-list';
    }
    
    /**
     * Hiển thị danh sách phòng đã tham gia
     */
    showJoinedRooms() {
        const joinedRoomsContainer = this.elements.chatContent.querySelector('.joined-rooms');
        if (!joinedRoomsContainer) return;
        
        // Hiển thị danh sách phòng đã tham gia
        this.showRoomList(this.chatApp.joinedRooms, 'joined');
    }
    
    /**
     * Hiển thị danh sách phòng có sẵn
     */
    showAvailableRooms() {
        const availableRoomsContainer = this.elements.chatContent.querySelector('.available-rooms');
        if (!availableRoomsContainer) return;
        
        // Hiển thị danh sách phòng có sẵn
        this.showRoomList(this.chatApp.availableRooms, 'available');
    }
    
    /**
     * Hiển thị danh sách phòng
     */
    showRoomList(rooms = [], type = 'available') {
        const container = this.elements.chatContent.querySelector(`.${type}-rooms`);
        if (!container) return;
        
        // Xóa nội dung cũ
        container.innerHTML = '';
        
        // Kiểm tra nếu không có phòng
        if (!rooms || rooms.length === 0) {
            container.innerHTML = `<div class="empty-list">Không có phòng chat nào</div>`;
            return;
        }
        
        // Hiển thị danh sách phòng
        rooms.forEach(room => {
            const roomItem = document.createElement('div');
            roomItem.className = 'room-item';
            roomItem.innerHTML = `
                <div class="room-info">
                    <div class="room-name">${room.name}</div>
                    <div class="room-description">${room.description || 'Không có mô tả'}</div>
                </div>
                ${type === 'joined' ? `<div class="unread-badge" style="display: none;">0</div>` : ''}
                <button class="join-btn">${type === 'joined' ? 'Vào phòng' : 'Tham gia'}</button>
            `;
            
            // Thêm sự kiện cho nút tham gia
            roomItem.querySelector('.join-btn').addEventListener('click', () => {
                this.chatApp.joinChatRoom(room.id);
            });
            
            // Cập nhật số tin nhắn chưa đọc nếu là phòng đã tham gia
            if (type === 'joined') {
                const unreadBadge = roomItem.querySelector('.unread-badge');
                const unreadCount = this.chatApp.unreadMessages[room.id] || 0;
                
                if (unreadCount > 0) {
                    unreadBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    unreadBadge.style.display = 'flex';
                }
            }
            
            // Thêm vào container
            container.appendChild(roomItem);
        });
    }
    
    /**
     * Hiển thị phòng chat
     */
    showChatRoom(room) {
        const { chatContent, backBtn, chatInput } = this.elements;
        
        // Hiển thị nút quay lại
        backBtn.style.display = 'block';
        
        // Xóa nội dung cũ
        chatContent.innerHTML = '';
        
        // Cập nhật tiêu đề
        this.elements.chatHeader.querySelector('.title').textContent = room.name || 'Phòng chat';
        
        // Tạo container cho tin nhắn
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'messages';
        chatContent.appendChild(messagesContainer);
        
        // Hiển thị phần nhập liệu
        chatInput.style.display = 'flex';
        
        // Cập nhật view hiện tại
        this.chatApp.currentView = 'chat-room';
    }
    
    /**
     * Cập nhật badge thông báo
     */
    updateNotificationBadge() {
        const { notificationBadge } = this.elements;
        
        if (this.chatApp.totalUnread > 0) {
            notificationBadge.textContent = this.chatApp.totalUnread > 99 ? '99+' : this.chatApp.totalUnread;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
    
    /**
     * Hiển thị danh sách phòng chat công khai
     * @param {Array} rooms - Danh sách phòng chat công khai
     */
    showPublicRoomsUI(rooms) {
        const { chatContent, backBtn, chatInput } = this.elements;
        
        // Hiển thị nút quay lại
        backBtn.style.display = 'block';
        
        // Ẩn phần nhập liệu
        chatInput.style.display = 'none';
        
        // Xóa nội dung cũ
        chatContent.innerHTML = '';
        
        // Cập nhật tiêu đề
        this.elements.chatHeader.querySelector('.title').textContent = 'Phòng Chat Công Khai';
        
        // Tạo container cho danh sách phòng
        const publicRoomsContainer = document.createElement('div');
        publicRoomsContainer.className = 'public-rooms';
        
        const header = document.createElement('h2');
        header.textContent = 'Phòng chat công khai';
        
        const description = document.createElement('p');
        description.textContent = 'Chọn một phòng chat để tham gia và trò chuyện với những người khác.';
        
        // Tạo tabs để phân biệt phòng đã tham gia và chưa tham gia
        const roomTabs = document.createElement('div');
        roomTabs.className = 'room-tabs';
        roomTabs.innerHTML = `
            <button class="tab-btn active" data-tab="all">Tất cả phòng</button>
            <button class="tab-btn" data-tab="joined">Đã tham gia</button>
        `;
        
        // Thêm sự kiện cho các tab
        const tabBtns = roomTabs.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Xóa active class từ tất cả các tab
                tabBtns.forEach(b => b.classList.remove('active'));
                
                // Thêm active class cho tab được chọn
                btn.classList.add('active');
                
                // Lọc và hiển thị danh sách phòng tương ứng
                const tabName = btn.getAttribute('data-tab');
                if (tabName === 'all') {
                    showRooms(rooms);
                } else if (tabName === 'joined') {
                    // Lọc ra các phòng đã tham gia
                    const joinedRooms = rooms.filter(room => 
                        this.chatApp.joinedRooms && this.chatApp.joinedRooms.some(jr => jr._id === room._id)
                    );
                    showRooms(joinedRooms);
                }
            });
        });
        
        const roomList = document.createElement('div');
        roomList.className = 'room-list';
        
        // Hàm hiển thị danh sách phòng
        const showRooms = (roomsToShow) => {
            // Xóa nội dung cũ
            roomList.innerHTML = '';
            
            // Kiểm tra nếu không có phòng
            if (!roomsToShow || roomsToShow.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-list';
                emptyMessage.textContent = 'Không có phòng chat công khai nào hiện tại.';
                roomList.appendChild(emptyMessage);
                return;
            }
            
            // Hiển thị danh sách phòng
            roomsToShow.forEach(room => {
                // Kiểm tra xem đã tham gia phòng này chưa
                const isJoined = this.chatApp.joinedRooms && this.chatApp.joinedRooms.some(jr => jr._id === room._id);
                
                const roomItem = document.createElement('div');
                roomItem.className = 'room-item';
                if (isJoined) {
                    roomItem.classList.add('joined');
                }
                
                const roomInfo = document.createElement('div');
                roomInfo.className = 'room-info';
                
                const roomName = document.createElement('div');
                roomName.className = 'room-name';
                roomName.textContent = room.name || 'Phòng chat không tên';
                
                const roomDescription = document.createElement('div');
                roomDescription.className = 'room-description';
                roomDescription.textContent = room.description || 'Không có mô tả';
                
                const roomStats = document.createElement('div');
                roomStats.className = 'room-stats';
                
                const userCount = document.createElement('span');
                userCount.className = 'user-count';
                userCount.innerHTML = `<i class="fas fa-users"></i> ${room.current_users || 0} người dùng`;
                
                if (isJoined) {
                    const joinedBadge = document.createElement('span');
                    joinedBadge.className = 'joined-badge';
                    joinedBadge.innerHTML = `<i class="fas fa-check-circle"></i> Đã tham gia`;
                    roomStats.appendChild(joinedBadge);
                }
                
                roomStats.appendChild(userCount);
                roomInfo.appendChild(roomName);
                roomInfo.appendChild(roomDescription);
                roomInfo.appendChild(roomStats);
                
                const joinButton = document.createElement('button');
                joinButton.className = 'join-btn';
                joinButton.textContent = isJoined ? 'Vào phòng' : 'Tham gia';
                joinButton.addEventListener('click', () => {
                    this.chatApp.joinPublicRoom(room._id);
                });
                
                roomItem.appendChild(roomInfo);
                roomItem.appendChild(joinButton);
                roomList.appendChild(roomItem);
            });
        };
        
        // Hiển thị tất cả phòng ban đầu
        showRooms(rooms);
        
        publicRoomsContainer.appendChild(header);
        publicRoomsContainer.appendChild(description);
        publicRoomsContainer.appendChild(roomTabs);
        publicRoomsContainer.appendChild(roomList);
        
        // Thêm container vào chatContent
        chatContent.appendChild(publicRoomsContainer);
        
        // Cập nhật view hiện tại
        this.chatApp.currentView = 'public-rooms';
    }
    
    /**
     * Hiển thị giao diện phòng chat công khai
     * @param {Object} room - Thông tin phòng chat
     * @param {Array} users - Danh sách người dùng trong phòng
     */
    showPublicChatRoom(room, users = []) {
        const { chatContent, backBtn, chatInput } = this.elements;
        
        // Hiển thị nút quay lại
        backBtn.style.display = 'block';
        
        // Xóa nội dung cũ
        chatContent.innerHTML = '';
        
        // Cập nhật tiêu đề
        this.elements.chatHeader.querySelector('.title').textContent = room.name || 'Phòng chat công khai';
        
        // Thêm nút tùy chọn vào header
        const headerTitle = this.elements.chatHeader.querySelector('.title');
        if (!this.elements.chatHeader.querySelector('.options-btn')) {
            const optionsBtn = document.createElement('button');
            optionsBtn.className = 'options-btn';
            optionsBtn.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
            headerTitle.parentNode.insertBefore(optionsBtn, headerTitle.nextSibling);
            
            // Thêm menu tùy chọn
            const optionsMenu = document.createElement('div');
            optionsMenu.className = 'options-menu';
            optionsMenu.style.display = 'none';
            optionsMenu.innerHTML = `
                <div class="option-item view-members">
                    <i class="fas fa-users"></i> Xem thành viên
                </div>
                <div class="option-item leave-room">
                    <i class="fas fa-sign-out-alt"></i> Rời phòng
                </div>
            `;
            this.elements.chatHeader.appendChild(optionsMenu);
            
            // Thêm sự kiện cho nút tùy chọn
            optionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                optionsMenu.style.display = optionsMenu.style.display === 'none' ? 'block' : 'none';
            });
            
            // Thêm sự kiện cho tùy chọn xem thành viên
            optionsMenu.querySelector('.view-members').addEventListener('click', () => {
                optionsMenu.style.display = 'none';
                this.toggleMembersList();
            });
            
            // Thêm sự kiện cho tùy chọn rời phòng
            optionsMenu.querySelector('.leave-room').addEventListener('click', () => {
                optionsMenu.style.display = 'none';
                this.chatApp.leavePublicRoom();
            });
            
            // Đóng menu khi click ra ngoài
            document.addEventListener('click', () => {
                optionsMenu.style.display = 'none';
            });
        }
        
        // Tạo container cho nội dung chat
        const chatContainer = document.createElement('div');
        chatContainer.className = 'public-chat-container';
        
        // Khu vực tin nhắn
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'messages';
        messagesContainer.id = 'messages-container';
        
        // Khu vực danh sách người dùng (ẩn mặc định)
        const roomUsers = document.createElement('div');
        roomUsers.className = 'room-users';
        roomUsers.style.display = 'none';
        
        // Tiêu đề khu vực người dùng
        const roomUsersHeader = document.createElement('div');
        roomUsersHeader.className = 'room-users-header';
        
        const roomUsersTitle = document.createElement('h3');
        roomUsersTitle.textContent = 'Người dùng trong phòng';
        
        const closeUsersBtn = document.createElement('button');
        closeUsersBtn.className = 'close-users-btn';
        closeUsersBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeUsersBtn.addEventListener('click', () => {
            this.toggleMembersList();
        });
        
        roomUsersHeader.appendChild(roomUsersTitle);
        roomUsersHeader.appendChild(closeUsersBtn);
        
        // Danh sách người dùng
        const userList = document.createElement('div');
        userList.className = 'user-list';
        userList.id = 'room-users-list';
        
        roomUsers.appendChild(roomUsersHeader);
        roomUsers.appendChild(userList);
        
        // Thêm các phần tử vào container
        chatContainer.appendChild(messagesContainer);
        chatContainer.appendChild(roomUsers);
        
        // Thêm container vào chatContent
        chatContent.appendChild(chatContainer);
        
        // Hiển thị phần nhập liệu
        chatInput.style.display = 'flex';
        
        // Cập nhật danh sách người dùng
        this.updateRoomUsersList(users);
        
        // Cập nhật view hiện tại
        this.chatApp.currentView = 'public-chat';
        this.chatApp.currentRoomId = room._id;
        
        // Lưu thông tin phòng chat đã tham gia vào localStorage
        if (room && room._id) {
            this.chatApp.storage.addJoinedPublicRoom(room);
            this.chatApp.storage.storeJoinedPublicRooms();
        }
        
        // Thêm sự kiện xử lý khi người dùng rời trang
        window.addEventListener('beforeunload', (event) => {
            // Không rời phòng chat khi tải lại trang
            // Chỉ lưu trạng thái phòng chat hiện tại
            if (this.chatApp.currentView === 'public-chat' && this.chatApp.currentRoomId) {
                this.chatApp.storage.storeJoinedPublicRooms();
            }
        });
        
        // Thêm sự kiện cho input file trong phòng chat công khai
        const fileInput = chatInput.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.removeEventListener('change', this.chatApp.handleFileUpload);
            fileInput.addEventListener('change', (e) => this.chatApp.handlePublicFileUpload(e));
        }
        
        // Thêm sự kiện cho nút gửi trong phòng chat công khai
        const sendButton = chatInput.querySelector('button');
        if (sendButton) {
            sendButton.removeEventListener('click', this.chatApp.sendMessage);
            sendButton.addEventListener('click', () => this.chatApp.sendPublicMessage());
        }
        
        // Thêm sự kiện cho input text trong phòng chat công khai
        const textInput = chatInput.querySelector('input[type="text"]');
        if (textInput) {
            textInput.removeEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.chatApp.sendMessage();
            });
            textInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.chatApp.sendPublicMessage();
            });
        }
    }
    
    /**
     * Bật/tắt hiển thị danh sách thành viên
     */
    toggleMembersList() {
        const roomUsers = document.querySelector('.room-users');
        const messagesContainer = document.querySelector('.messages');
        
        if (roomUsers) {
            const isVisible = roomUsers.style.display !== 'none';
            roomUsers.style.display = isVisible ? 'none' : 'flex';
            
            // Điều chỉnh kích thước khu vực tin nhắn
            if (messagesContainer) {
                messagesContainer.style.width = isVisible ? '100%' : 'calc(100% - 250px)';
            }
        }
    }
    
    /**
     * Cập nhật danh sách người dùng trong phòng chat
     * @param {Array} users - Danh sách người dùng
     */
    updateRoomUsersList(users = []) {
        const userList = document.getElementById('room-users-list');
        if (!userList) return;
        
        userList.innerHTML = '';
        
        if (users.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-list';
            emptyMessage.textContent = 'Không có người dùng nào trong phòng.';
            userList.appendChild(emptyMessage);
            return;
        }
        
        users.forEach(user => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            
            const userAvatar = document.createElement('div');
            userAvatar.className = 'user-avatar';
            
            const avatarImg = document.createElement('img');
            avatarImg.src = user.avatar || 'images/default-avatar.png';
            avatarImg.alt = user.name || 'User';
            avatarImg.onerror = function() {
                this.src = 'images/default-avatar.png';
            };
            
            userAvatar.appendChild(avatarImg);
            
            const userInfo = document.createElement('div');
            userInfo.className = 'user-info';
            
            const userName = document.createElement('div');
            userName.className = 'user-name';
            userName.textContent = user.name || 'Người dùng ẩn danh';
            
            userInfo.appendChild(userName);
            
            userItem.appendChild(userAvatar);
            userItem.appendChild(userInfo);
            
            userList.appendChild(userItem);
        });
    }
} 