// Simulate sending notifications (email/SMS)
module.exports = {
    notify: (user, type, message) => {
        // Placeholder: Replace with actual email/SMS integration
        console.log(`[Notifier] To: ${user.email} | Type: ${type} | Message: ${message}`);
    }
};