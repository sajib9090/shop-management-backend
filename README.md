# shop-management-backend

We are not using mongoose for this project. Just because when we started using mongoose , it was great but it's not suitable for free server/backend deployment site, and one additional reason is mongoose make server request timeout for free users. That's why we use direct mongodb with our custom validation as much as we can.

creating users =>
endpoint-- api/v1/users/create-user == method --post
required info - email, username, mobile, shop_name and password.



