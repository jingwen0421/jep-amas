# Multilingual Support Guide

## Overview

JEP Image Makeup Academy Management System is designed with multilingual support, currently supporting:

- **English** (Default - Primary Language)
- **Chinese** (中文) (Secondary Language)

## Language Strategy

### Primary Language: English

All system interfaces are designed and implemented in English:
- Navigation menus
- Forms and input fields
- Buttons and actions
- Dashboard widgets
- Reports and analytics
- Settings pages
- Notifications and alerts
- System messages
- Mock data and examples

### Secondary Language: Chinese

Chinese language support is built into the system architecture and ready for activation:
- Translation framework implemented
- Language switcher in top navigation
- Student language preferences tracked
- Notification templates support both languages
- UI designed to accommodate Chinese text

## Architecture

### Language Context

Located at: `src/app/context/LanguageContext.tsx`

The language context provides:
- Current language state (`'en'` | `'zh'`)
- `setLanguage()` function to switch languages
- `t()` translation function for looking up translated strings

### Translation Keys

All translatable strings are organized by feature area:

```typescript
const translations = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.students': 'Student Management',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    // ...
  },
  zh: {
    'nav.dashboard': '仪表板',
    'nav.students': '学生管理',
    'common.save': '保存',
    'common.cancel': '取消',
    // ...
  }
};
```

### Usage in Components

```typescript
import { useLanguage } from '../context/LanguageContext';

function MyComponent() {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <div>
      <h1>{t('nav.dashboard')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

## Language Switcher

### Location
Top navigation bar (header), visible on all pages

### Features
- Globe icon indicator
- Dropdown menu with language options
- Current language highlighted
- Instant switching without page reload
- Persisted across sessions (can be enhanced with localStorage)

### User Experience
1. User clicks globe icon in header
2. Dropdown shows: English, 中文 (Chinese)
3. Current language has visual indicator
4. Click to switch instantly
5. All UI updates to selected language

## Student Language Preferences

### Registration Form
Location: `src/app/pages/students/StudentRegistration.tsx`

Students select their preferred language during registration:
- English
- Chinese (中文)

### Student Profile
Location: `src/app/pages/students/StudentProfile.tsx`

Student profiles display the preferred language with a visual badge.

### Use Cases
- Send notifications in student's preferred language
- Generate certificates in appropriate language
- Customize communication templates
- Provide course materials in preferred language

## Notification Templates

### Multi-language Support

All notification templates support both English and Chinese:

**WhatsApp Templates:**
- Class Reminder
- Payment Reminder
- Appointment Reminder
- Course Update
- Certificate Ready
- Attendance Warning

**Email Templates:**
- Welcome Email
- Registration Approved
- Payment Confirmation
- Course Completion
- Invoice
- General Announcement

### Implementation Pattern

```typescript
const templates = {
  classReminder: {
    en: "Reminder: Your {className} class is at {time}",
    zh: "提醒：您的{className}课程时间为{time}"
  },
  paymentDue: {
    en: "Payment due: RM {amount} for {course}",
    zh: "应付款项：{course}的RM {amount}"
  }
};
```

## UI Design Considerations

### Text Expansion
Chinese text is typically **30-50% shorter** than English for the same content.

**Design accommodations:**
- Flexible container widths
- Dynamic button sizing
- Responsive grid layouts
- No fixed-width text containers
- Adequate padding and spacing

### Font Rendering
The system uses system fonts that support both English and Chinese:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
  'PingFang SC', 'Microsoft YaHei', sans-serif;
```

### Mixed Language Content
Some content may mix English and Chinese:
- Student names (English names with Chinese characters)
- Course titles (bilingual)
- Product names (often kept in English)

The UI handles mixed content gracefully without breaking layouts.

## Adding New Translations

### Step 1: Add Translation Keys

Edit `src/app/context/LanguageContext.tsx`:

```typescript
const translations = {
  en: {
    // Add new keys
    'feature.newButton': 'New Feature',
    'feature.description': 'This is a new feature',
  },
  zh: {
    // Add Chinese translations
    'feature.newButton': '新功能',
    'feature.description': '这是一个新功能',
  }
};
```

### Step 2: Use in Components

```typescript
function NewFeature() {
  const { t } = useLanguage();
  
  return (
    <div>
      <button>{t('feature.newButton')}</button>
      <p>{t('feature.description')}</p>
    </div>
  );
}
```

### Step 3: Test Both Languages

1. Switch to English - verify text displays correctly
2. Switch to Chinese - verify Chinese text displays correctly
3. Check for layout issues with longer/shorter text
4. Verify special characters render properly

## Current Implementation Status

### ✅ Implemented
- Language context and provider
- Language switcher in navigation
- English translations (complete)
- Chinese translation keys (sample set)
- Student language preference field
- Multilingual-ready UI layouts

### 🚧 To Be Completed
- Full Chinese translations for all pages
- Language persistence (localStorage)
- RTL support (if needed for future languages)
- Language-specific date/time formatting
- Currency formatting by locale
- Pluralization rules

## Best Practices

### 1. Always Use Translation Keys
```typescript
// ❌ Bad
<button>Save</button>

// ✅ Good
<button>{t('common.save')}</button>
```

### 2. Organize Keys Logically
```typescript
'nav.dashboard'           // Navigation items
'common.save'             // Common actions
'student.profile.title'   // Feature-specific
'error.notFound'          // Error messages
```

### 3. Avoid Hardcoded Text
All user-facing text should be translatable, including:
- Labels and headings
- Button text
- Error messages
- Placeholder text
- Tooltips and hints
- Success messages

### 4. Handle Dynamic Content
```typescript
// Use template variables for dynamic content
const message = t('payment.due')
  .replace('{amount}', amount)
  .replace('{date}', date);
```

### 5. Test Layout Flexibility
- Test with longest possible text (usually English)
- Test with shortest text (usually Chinese)
- Ensure UI doesn't break in either case

## Future Enhancements

### Additional Languages
The architecture supports adding more languages:
1. Add language code to Language type: `'en' | 'zh' | 'ms' | 'ta'`
2. Add translations object for new language
3. Add option to language switcher
4. Update student preference options

### Automatic Language Detection
```typescript
// Detect browser language
const browserLang = navigator.language.split('-')[0];
if (browserLang === 'zh') {
  setLanguage('zh');
}
```

### Language-Specific Content
- Different images/graphics per language
- Localized help documentation
- Region-specific features
- Custom formatting rules

## Testing Checklist

- [ ] Language switcher visible on all pages
- [ ] Switching languages updates all text immediately
- [ ] No layout breaks when switching languages
- [ ] Student registration form has language preference
- [ ] Student profile displays preferred language
- [ ] Notification templates support both languages
- [ ] No hardcoded English text in production
- [ ] Special characters (中文) render correctly
- [ ] Mixed language content displays properly
- [ ] Navigation menu translates correctly

## Technical Notes

### Character Encoding
All files use **UTF-8** encoding to support Chinese characters.

### Font Loading
System fonts ensure Chinese characters display correctly without custom font loading.

### Performance
Translation lookup is fast (object property access). No performance impact from language switching.

### Browser Support
Works in all modern browsers with Unicode support.

---

**Language Support Status**: English (Primary), Chinese (Ready)  
**Last Updated**: June 2, 2026  
**Maintained By**: JEP Academy Development Team
