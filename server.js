const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();
const PORT = 3000;

// 1. الإعدادات الأساسية
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 2. إعدادات الإيميل (ضع بياناتك الحقيقية هنا)
const transporter = nodemailer.createTransport({
    service: 'gmail',
auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
}
});

let tempStorage = { email: "", code: "" };

// 3. مسار إرسال كود التحقق (من صفحة التسجيل)
app.post('/send-verification', (req, res) => {
    const { email, password, confirmPassword, userCaptcha, realCaptcha } = req.body;

    if (userCaptcha !== realCaptcha) return res.send('<h1>خطأ في الكابتشا!</h1>');
    if (password !== confirmPassword) return res.send('<h1>كلمة المرور غير متطابقة!</h1>');

    const verificationCode = Math.floor(100000 + Math.random() * 900000);
    tempStorage.email = email;
    tempStorage.code = verificationCode.toString();

    const mailOptions = {
        from: 'نظام التسجيل الاحترافي',
        to: email,
        subject: 'رمز التحقق الخاص بك 🔐',
        text: `كود تفعيل حسابك هو: ${verificationCode}`
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            console.log(err);
            return res.send('<h1>حدث خطأ في إرسال الإيميل!</h1>');
        }
        res.redirect('/verify.html');
    });
});

// 4. مسار التحقق من الكود (من صفحة التفعيل)
app.post('/verify-code', (req, res) => {
    if (req.body.code === tempStorage.code) {
        res.redirect('/form.html');
    } else {
        res.send('<h1>الرمز الذي أدخلته غير صحيح ❌</h1>');
    }
});

// 5. مسار استقبال الفورم النهائي (من صفحة البيانات)
app.post('/submit-form', (req, res) => {
    const data = req.body;

    // طباعة البيانات في التيرمينال بشكل منظم
    console.log("\n========================================");
    console.log("📩 وصلت بيانات جديدة الآن:");
    console.log("========================================");
    console.log(`👤 الدور: ${data.role}`);
    console.log(`📝 الاسم: ${data.firstName} ${data.lastName}`);
    console.log(`🚻 النوع: ${data.gender} | 🎂 العمر: ${data.age}`);
    console.log(`🌍 الجنسية: ${data.nationality}`);
    console.log(`📧 الإيميل: ${data.email}`);
    console.log(`📱 واتساب: ${data.whatsapp}`);
    console.log(`🏠 بلد الإقامة: ${data.residence}`);
    
    if (data.role === 'teacher') {
        console.log(`🎓 التخصص: ${data.specialty}`);
        console.log(`👥 الفئات: ${data.categories}`);
    }
    console.log("========================================\n");

    // التحويل لصفحة النجاح
    res.redirect('/success.html');
});

// 6. تشغيل السيرفر
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}
module.exports = app;