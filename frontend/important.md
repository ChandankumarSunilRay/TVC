
What is Redux?
Why use Redux instead of local state?
What is Redux Toolkit?
What is a store?
What is an action and payload?
What is a reducer?
Difference between dispatch and useSelector.
What does Provider do?
What is a slice?
Why is Redux Toolkit preferred over traditional Redux?
How does Redux handle asynchronous API calls?
What are middleware and Redux Thunk?
Context API vs Redux?
Local state vs global state?
What is RTK Query?


-- Redux Fundamentals:
Store
State
Action
Payload
Reducer
Dispatch
Selector
Middleware
Immutability


-- Redux Toolkit Functions:
configureStore()
createSlice()


-- React Redux :
<Provider store={store}>
useSelector()
useDispatch()

-- Async Redux:
createAsyncThunk
pending
fulfilled
rejected
Loading and error states


-- RTK Query: Use it for managing API data:
Queries
Mutations
Caching
Loading and error handling
Automatic refetching


-- Interview preparation: Be able to explain:
Context API vs Redux
Redux vs local state
Redux Toolkit advantages
useSelector vs useDispatch
Store, slice, reducer, action, and payload
Async API handling
RTK Query


-- Add these important topics:
extraReducers for createAsyncThunk
Store setup with multiple slices
initialState
Reducer logic and generated actions
Immutable updates / Immer
Error handling
Redux DevTools
RTK Query: endpoints, useQuery, and useMutation


Course search, filters, and pagination.
Editing existing courses and lectures.
Editing profile and changing password while logged in.
Purchase/payment history.
Resume videos from the last watched position.
404 and access-denied pages.
Resend OTP.

Fix the critical bugs:
OTP exposure, 
payment reuse, 
and public video access.

- **OTP exposed in the token:** Someone can read the OTP and verify an account without accessing the email. Fix: Store the OTP securely on the backend.

- **Payment can be reused:** One valid payment can unlock other courses because verification doesn’t check the buyer, course, price, or previous use. Fix: Link each order to these details and accept each payment only once.

- **Paid videos have public URLs:** Anyone knowing the video URL can watch without logging in or purchasing. Fix: Check login and course ownership before serving videos.

- **Old password-reset links can work again:** Requesting a new reset link can make an older link usable again. Fix: Use unique, expiring, single-use reset tokens.


1.	server/controllers/user.js	27-35	OTP is embedded in the activation JWT and returned to the frontend, so email ownership is not truly verified.
2	🟠 HIGH	server/controllers/course.js	98-138	Payment verification does not validate the user, course, amount, or payment replay. A cheaper valid payment could unlock another course.	10/10
3	🟠 HIGH	server/index.js	24	The entire uploads directory is public, so paid lecture videos can be accessed without authentication.	10/10
4	🟡 MEDIUM	server/controllers/user.js	121-158	Older password-reset links remain usable when a newer reset link is requested.	9/10
