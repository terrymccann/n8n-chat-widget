// Chat Widget Script
(function() {
    console.log("Chat widget script started");

    // Prevent multiple initializations
    if (window.N8NChatWidgetInitialized) {
        console.log("Widget already initialized, stopping");
        return;
    }
    window.N8NChatWidgetInitialized = true;

    // Default configuration
    const defaultConfig = {
        webhook: {
            url: '',
            route: ''
        },
        branding: {
            logo: '',
            name: '',
            subheaderText: 'You can ask me anything',
            fallbackWelcomeMessage: 'Welcome! How can I help you today?',
            poweredBy: {
                text: 'Powered by',
                link: 'https://your-website.com'
            }
        },
        ui: {
            quickReplies: [
                { text: 'Special Offers', action: 'special' },
                { text: 'Summer Outfits', action: 'summer' },
                { text: 'Buy a Gifcard', action: 'gifcard' },
                { text: 'New Collection', action: 'new' }
            ]
        },
        style: {
            primaryColor: '#854fff',
            secondaryColor: '#6b3fd4',
            position: 'right',
            backgroundColor: '#ffffff',
            fontColor: '#333333',
            lightBgColor: '#f5f5f7'
        }
    };

    // Merge user config with defaults
    const config = window.ChatWidgetConfig ? 
        {
            webhook: { ...defaultConfig.webhook, ...window.ChatWidgetConfig.webhook },
            branding: { ...defaultConfig.branding, ...window.ChatWidgetConfig.branding },
            ui: { ...defaultConfig.ui, ...(window.ChatWidgetConfig.ui || {}) },
            style: { ...defaultConfig.style, ...window.ChatWidgetConfig.style }
        } : defaultConfig;

    console.log("Config loaded:", config);

    let currentSessionId = '';
    let welcomeMessageShown = false;
    
    // Generate a UUID for the session
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Initialize session ID at widget load time
    function initializeSessionId() {
        const savedSessionId = localStorage.getItem('n8n_chat_session_id');
        if (savedSessionId) {
            console.log("Retrieved saved session ID from localStorage:", savedSessionId);
            currentSessionId = savedSessionId;
        } else {
            // Generate a new session ID if none exists
            currentSessionId = generateUUID();
            // Save the session ID to localStorage
            localStorage.setItem('n8n_chat_session_id', currentSessionId);
            console.log("Generated new session ID and saved to localStorage:", currentSessionId);
        }
        return currentSessionId;
    }
    
    // Initialize session ID immediately
    initializeSessionId();

    // Load Geist font
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css';
    document.head.appendChild(fontLink);

    // Load external CSS file
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'chat-widget.css';
    document.head.appendChild(cssLink);
    console.log("CSS loaded");
    
    // Create chat container HTML
    function createChatContainer() {
        const container = document.createElement('div');
        container.className = 'n8n-chat-widget';
        
        // Set CSS variables for custom styling
        container.style.setProperty('--n8n-chat-primary-color', config.style.primaryColor);
        container.style.setProperty('--n8n-chat-secondary-color', config.style.secondaryColor);
        container.style.setProperty('--n8n-chat-background-color', config.style.backgroundColor);
        container.style.setProperty('--n8n-chat-font-color', config.style.fontColor);
        container.style.setProperty('--n8n-chat-light-bg', config.style.lightBgColor);
        
        container.innerHTML = `
            <div class="chat-container ${config.style.position === 'left' ? 'position-left' : ''}">
                <div class="brand-header">
                    ${config.branding.logo ? `<img src="${config.branding.logo}" alt="${config.branding.name} Logo">` : ''}
                    <div>
                        <span>${config.branding.name}</span>
                    </div>
                    <button class="close-button" aria-label="Close chat">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                            <path fill="currentColor" d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59 7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12 5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"/>
                        </svg>
                    </button>
                </div>
                <div class="chat-interface active">
                    <div class="chat-messages"></div>
                    <div class="chat-input">
                        <textarea placeholder="Type your message here..." rows="1"></textarea>
                        <button type="submit" aria-label="Send message">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="chat-footer">
                        <a href="${config.branding.poweredBy.link}" target="_blank">${config.branding.poweredBy.text} ${config.branding.poweredBy.link.split('//')[1].split('/')[0]}</a>
                    </div>
                </div>
            </div>
            <button class="chat-toggle ${config.style.position === 'left' ? 'position-left' : ''}" aria-label="Toggle chat">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
                    <path fill="currentColor" d="M7 9h10v2H7zm0-3h10v2H7zm0 6h5v2H7z"/>
                </svg>
            </button>
        `;
        
        return container;
    }

    // Render chat message
    function renderChatMessage(message, isUser = false) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${isUser ? 'user' : 'bot'}`;
        messageElement.textContent = message;
        
        const chatMessages = document.querySelector('.n8n-chat-widget .chat-messages');
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageElement;
    }

    // Render quick replies
    function renderQuickReplies(quickReplies) {
        if (!quickReplies || !quickReplies.length) return;
        
        const quickRepliesContainer = document.createElement('div');
        quickRepliesContainer.className = 'quick-replies';
        
        const quickRepliesHtml = quickReplies.map(reply => {
            return `<button class="quick-reply-btn" data-action="${reply.action || ''}">${reply.text}</button>`;
        }).join('');
        
        quickRepliesContainer.innerHTML = quickRepliesHtml;
        
        const chatMessages = document.querySelector('.n8n-chat-widget .chat-messages');
        chatMessages.appendChild(quickRepliesContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Send a message
    function sendMessage(message, additionalMetadata = {}) {
        // Show user message
        renderChatMessage(message, true);
        
        // Remove any quick replies when user sends a message
        const quickReplies = document.querySelectorAll('.n8n-chat-widget .quick-replies');
        quickReplies.forEach(el => el.remove());
        
        // Ensure session ID is initialized
        if (!currentSessionId) {
            currentSessionId = initializeSessionId();
            console.log("Re-initialized session ID before sending message:", currentSessionId);
        }
        
        // Normal fetch - using the exact format from the working code
        console.log("Sending message to webhook:", config.webhook.url);
        
        // Construct data payload exactly as it was in the working code
        const messageData = {
            action: "sendMessage",
            sessionId: currentSessionId,
            route: config.webhook.route,
            chatInput: message,
            metadata: {
                userId: ""
            }
        };
        
        fetch(config.webhook.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        }).then(response => response.json())
          .then(data => {
            console.log("Message sent, response:", data);
            
            // Handle bot response - using exact response format from working code
            const botResponse = Array.isArray(data) ? data[0].output : data.output;
            renderChatMessage(botResponse || "I didn't understand that. Could you try again?");
            
            // Show quick replies
            if (config.ui.quickReplies && config.ui.quickReplies.length) {
                renderQuickReplies(config.ui.quickReplies);
            }
          })
          .catch(error => {
            console.error("Error sending message:", error);
            renderChatMessage("Sorry, there was an error processing your message. Please try again later.");
          });
    }

    // Initialize chat widget
    function initChatWidget() {
        console.log("Initializing chat widget");
        
        // Create and add the widget to DOM
        const widgetElement = createChatContainer();
        document.body.appendChild(widgetElement);
        
        // Get UI elements
        const chatContainer = document.querySelector('.n8n-chat-widget .chat-container');
        const chatToggle = document.querySelector('.n8n-chat-widget .chat-toggle');
        const closeButton = document.querySelector('.n8n-chat-widget .close-button');
        const chatInterface = document.querySelector('.n8n-chat-widget .chat-interface');
        const chatMessages = document.querySelector('.n8n-chat-widget .chat-messages');
        const chatInput = document.querySelector('.n8n-chat-widget .chat-input textarea');
        const sendButton = document.querySelector('.n8n-chat-widget .chat-input button');
        
        console.log("Chat elements loaded:", {
            chatContainer: !!chatContainer,
            chatToggle: !!chatToggle,
            closeButton: !!closeButton,
            chatInterface: !!chatInterface
        });
        
        // Toggle chat visibility
        chatToggle.addEventListener('click', function() {
            console.log("Toggle clicked, current open state:", chatContainer.classList.contains('open'));
            const wasOpen = chatContainer.classList.contains('open');
            chatContainer.classList.toggle('open');
            
            // If chat is being opened (not closed) and welcome message hasn't been shown yet
            if (!wasOpen && !welcomeMessageShown && config.branding.initialWelcomeMessage) {
                // Show the welcome message
                renderChatMessage(config.branding.initialWelcomeMessage);
                welcomeMessageShown = true;
                
                // If you have quick replies, show them after the welcome message
                if (config.ui.quickReplies && config.ui.quickReplies.length) {
                    renderQuickReplies(config.ui.quickReplies);
                }
            }
        });
        
        // Close chat
        closeButton.addEventListener('click', function() {
            chatContainer.classList.remove('open');
        });
        
        // Handle message sending
        function handleSendMessage() {
            const message = chatInput.value.trim();
            if (message) {
                sendMessage(message);
                chatInput.value = '';
                chatInput.style.height = '48px'; // Reset height after sending
            }
        }
        
        // Send message on button click
        sendButton.addEventListener('click', handleSendMessage);
        
        // Send message on Enter press (but allow Shift+Enter for new lines)
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        
        // Auto-resize textarea
        chatInput.addEventListener('input', function() {
            this.style.height = '48px';
            this.style.height = (this.scrollHeight) + 'px';
        });
        
        // Handle clicks on quick reply buttons
        chatMessages.addEventListener('click', function(e) {
            if (e.target.classList.contains('quick-reply-btn')) {
                const replyText = e.target.textContent;
                const action = e.target.getAttribute('data-action');
                sendMessage(replyText, { action: action });
                
                // Remove all quick replies after one is clicked
                const quickReplies = document.querySelectorAll('.n8n-chat-widget .quick-replies');
                quickReplies.forEach(el => el.remove());
            }
        });
        
        console.log("Chat widget initialized");
    }

    // Initialize everything when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatWidget);
    } else {
        initChatWidget();
    }
})();