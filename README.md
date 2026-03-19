# ECHO.11 Website

אתר פורטפוליו אישי של שירה שריד - AI Creative Strategist & Product Builder

## מבנה התיקייה

```
echo11-site/
├── index.html          # הקובץ הראשי
├── content/
│   └── site-content.md # כל התוכן המקורי (גיבוי)
└── images/             # תיקייה לתמונות (להוסיף)
```

## Deploy ב-Vercel

### שלב 1: יצירת Repo ב-GitHub
```bash
cd echo11-site
git init
git add .
git commit -m "Initial commit - ECHO.11 site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/echo11-site.git
git push -u origin main
```

### שלב 2: Deploy ב-Vercel
1. היכנסי ל-[vercel.com](https://vercel.com)
2. לחצי "Add New Project"
3. בחרי את ה-repo `echo11-site`
4. לחצי Deploy
5. זהו! 🚀

## הוספת תמונות

החליפי את ה-placeholders בקוד עם תמונות אמיתיות:

1. **Hero Image**: `hero-image.jpg` - הדמות בלבוש לבן
2. **Vision Image**: `vision-eyes.jpg` - עיניים עם השתקפות אסטרונאוט
3. **Article 1**: `ghost-machine.jpg` - פנים דיגיטליות עם גליץ'
4. **Article 2**: `unlimited-tools.jpg` - דמות עם קווי אור גיאומטריים
5. **About Image**: `luna-astronaut.jpg` - Luna האסטרונאוטית

### איך להחליף placeholder בתמונה:

בקובץ `index.html`, מצאי את:
```html
<div class="hero-placeholder">...</div>
```

והחליפי ב:
```html
<div class="hero-image">
    <img src="images/hero-image.jpg" alt="Decoding Human Resilience">
</div>
```

## פיצ'רים

- ✅ שעון דיגיטלי חי (header)
- ✅ תפריט המבורגר למובייל
- ✅ ניווט desktop
- ✅ אנימציות scroll
- ✅ רספונסיבי מלא
- ✅ Typography מקצועי (Outfit + Space Mono)
- ✅ כל התוכן מועתק מ-Framer

## התאמות עתידיות

- [ ] הוספת תמונות
- [ ] עמודי מאמרים נפרדים
- [ ] עמוד "Behind the Scenes"
- [ ] Google Analytics (להוסיף GA4 ID)
- [ ] חיבור ל-Substack RSS

## Stack

- HTML5
- CSS3 (Vanilla - no frameworks)
- Vanilla JavaScript
- Google Fonts (Outfit, Space Mono)

---
Built with 💙 by Shira & Claude
