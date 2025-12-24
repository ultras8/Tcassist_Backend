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
==================================

-- run
==================================
npm run start:dev

-- lib
==================================
--test
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