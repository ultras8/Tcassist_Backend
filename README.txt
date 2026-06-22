-- new feature
==================================
# switch branch
git checkout -b feat/(name branch)

# push
git add .
git commit -m "feat: (description)"
git push origin feat/(name branch)

# merge - Compare & pull request
==================================

-- CLI
==================================
# Module
nest g mo users

# Service
nest g s users

# Controller
nest g co users

nset g res admission
==================================

-- run
==================================
npm run start:dev

--test
==================================
# sueradmin
{
  "email": "test111@gmail.com",
  "password": "test111"
}
#users
{
  "email": "test2@gmail.com",
  "password": "test2"
}
#admin
{
  "email": "test3@gmail.com",
  "password": "test3"
}

SELECT 
    c."programCode", 
    c."majorName", 
    COUNT(s.id) as total_years_stat
FROM "admission_criteria" c  
INNER JOIN "admission_stats" s ON c."programCode" = s."programCode"
GROUP BY c."programCode", c."majorName"
HAVING COUNT(s.id) >= 1
ORDER BY total_years_stat DESC;

อันดับ,รหัสคณะ,คณะ / มหาวิทยาลัย,จุดที่น่าสนใจในการเทส
1,10020108903201,รัฐศาสตร์ (เอกปกครอง) - มก.,ข้อมูลปี 68 ล่าสุด: มีช่วงคะแนน 53 - 66 หนูกรอกคะแนนสายสังคมเยอะ คณะนี้จะเป็นตัววัดว่า Chance % จะออกมาเป็นสีเหลืองหรือเขียว
2,10020108113101,จิตวิทยา (จิตวิทยาชุมชน) - มก.,คะแนนเหวี่ยง: มีตั้งแต่ 46 ไปจนถึง 63 คะแนนของหนู (ประมาณ 60) น่าจะทำให้คณะนี้ขึ้น สีเขียว (Safe)
3,10090103903501,สังคมวิทยาเพื่อการพัฒนา - มศว,คู่แข่งสถาบัน: ข้อมูลปี 68 มีคนได้ 57 เยอะมาก คะแนนหนูเฉียดฉิว คณะนี้อาจจะขึ้น สีเหลือง (Uncertain)
4,10020106700301,ศึกษาศาสตร์ (ดิจิทัลเพื่อการศึกษา) - มก.,High Score Case: มีคนกดไปถึง 80 คะแนน! ถ้าหนูใส่คะแนนนี้เป็นอันดับ 1 ระบบควรเตือนว่า Medium Risk