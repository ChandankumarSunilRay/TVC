Login.jsx
→ loginUser()
→ POST /api/user/login
→ routes/user.js
→ controllers/user.js
→ User model / MongoDB
→ token + user returned
→ UserContext updates state
→ App.jsx shows protected pages


Courses.jsx
→ CourseContext.fetchCourses()
→ GET /api/course/all
→ routes/course.js
→ controllers/course.js
→ Courses model
→ courses returned
→ CourseCard displays them

Courses.jsx
→ CourseContext.fetchCourses()
→ GET /api/course/all
→ routes/course.js
→ controllers/course.js
→ Courses model
→ courses returned
→ CourseCard displays them

CourseDescription.jsx
→ checkout API
→ course route
→ course controller
→ payment verification
→ User subscription updated
→ Progress record created

CourseDescription.jsx
→ checkout API
→ course route
→ course controller
→ payment verification
→ User subscription updated
→ Progress record created

Lecture.jsx
→ fetch lectures
→ course controller
→ Lecture model
→ video displayed
→ video ends
→ addProgress()
→ Progress model updated
→ progress percentage returned

Admin page
→ form submission
→ API route
→ authentication middleware
→ controller
→ database/file upload
→ updated data displayed

## Payment setup

Add these Razorpay credentials to `server/.env` before starting the server.
Use test credentials locally and live credentials only in production:

```env
RAZORPAY_MODE=test
Razorpay_Key=rzp_test_your_key_id
Razorpay_Secret=your_test_key_secret
```

For live checkout, set `RAZORPAY_MODE=live` and use `rzp_live_` credentials.
The server refuses to start if the mode and key prefix do not match.

The key ID is returned to the frontend for checkout; the secret is used only
by the server to verify the payment signature. Never put the secret in frontend
environment variables or version control.

1. Which component starts it?
2. Which API URL is called?
3. Which route handles it?
4. Which controller and model are used?
5. How does the response return to the component?
