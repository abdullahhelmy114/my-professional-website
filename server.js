const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();
const PORT = 3000;

// 1. الإعدادات الأساسية
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

    // 1. تجهيز نص الرسالة بشكل منظم (HTML) لكي يظهر في إيميلك
    const emailBody = `
        <div dir="rtl" style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
            <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px;">طلب تسجيل جديد: ${data.role === 'teacher' ? 'معلم' : 'طالب'}</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr style="background: #f9fafb;">
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">الاسم الكامل</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${data.firstName} ${data.lastName}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">البريد الإلكتروني</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${data.email}</td>
                </tr>
                <tr style="background: #f9fafb;">
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">النوع / العمر</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${data.gender} / ${data.age} سنة</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">واتساب</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${data.whatsapp}</td>
                </tr>
                <tr style="background: #f9fafb;">
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">بلد الإقامة</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${data.residence}</td>
                </tr>
                ${data.role === 'teacher' ? `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">التخصص</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${data.specialty}</td>
                </tr>
                <tr style="background: #f9fafb;">
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">الفئات المستهدفة</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${data.categories}</td>
                </tr>
                ` : ''}
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">الساعات المتاحة</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">${data.availableHours}</td>
                </tr>
            </table>
            
            <p style="margin-top: 20px; color: #666; font-size: 12px;">تم إرسال هذا الطلب من موقع Alson الأكاديمي.</p>
        </div>
    `;

    // 2. إعدادات الإيميل الذي سيصلك أنت
    const adminMailOptions = {
        from: '"إدارة الموقع" <no-reply@alson.com>',
        to: process.env.EMAIL_USER, // سيصل الإيميل لنفس إيميلك المسجل في Vercel
        subject: `🔔 بيانات جديدة: ${data.firstName} (${data.role})`,
        html: emailBody // نرسل البيانات كـ HTML لتبدو منسقة
    };

    // 3. تنفيذ الإرسال
    transporter.sendMail(adminMailOptions, (err, info) => {
        if (err) {
            console.log("خطأ في إرسال بيانات الفورم للإيميل:", err);
            // حتى لو فشل الإرسال للإيميل، سنحول المستخدم لصفحة النجاح (أو يمكنك إظهار رسالة خطأ)
        }
        console.log("تم إرسال بيانات الفورم للإيميل بنجاح ✅");
        res.redirect('/success.html');
    });
});

// 6. تشغيل السيرفر
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}
module.exports = app;