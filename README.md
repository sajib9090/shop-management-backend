# shop-management-backend

We are not using mongoose for this project. Just because when we started using mongoose , it was great but it's not suitable for free server/backend deployment site, and one additional reason is mongoose make server request timeout for free users. That's why we use direct mongodb with our custom validation as much as we can.

creating users =>
endpoint-- api/v1/users/create-user == method --post
required info - email, username, mobile, shop_name and password.

collect data from user or visitor then send a email for verification after verification the user information insert into database

after activate user create shop with existing user information

create some middleware for validation

##create user route => 'api/v1/users/create-user',
##activate user with email validation route => 'api/v1/users/verify/:token'
##Require data for creating user.
=> shop_name: string (unique)
=> name: string (full name)
=> email: string (unique)
=> mobile: string
=> password: string(min 6 characters)
=> address: object{
detailed_shop_address: string,
country: string
}
