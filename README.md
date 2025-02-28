# N8N Chat Widget

A customizable chat widget for websites that integrates with N8N webhooks.

## Features

- Easy integration with any website
- Customizable appearance and behavior
- Session persistence across page refreshes
- Quick reply buttons
- Mobile-responsive design

## Usage

### Basic Implementation

```html
<script>
window.ChatWidgetConfig = {
    webhook: {
        url: 'https://your-n8n-webhook-url',
        route: 'general'
    },
    branding: {
        logo: 'path/to/logo.png',
        name: 'Your Brand',
        initialWelcomeMessage: 'Hello! How can I help you today?'
    }
};
</script>
<script src="path/to/chat-widget.js"></script>
```

### Configuration Options

| Option | Description |
|--------|-------------|
| webhook.url | N8N webhook URL |
| webhook.route | Optional route for the webhook |
| branding.logo | URL to your logo |
| branding.name | Your brand name |
| ... | ... |

## License

MIT
