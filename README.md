# shop-management-backend

We are not using mongoose for this project. Just because when we started using mongoose , it was great but it's not suitable for free server/backend deployment site, and one additional reason is mongoose make server request timeout for free users. That's why we use direct mongodb with our custom validation as much as we can.

creating users =>
endpoint-- api/v1/users/create-user == method --post
required info - email, username, mobile, shop_name and password.

collect data from user or visitor then send a email for verification after verification the user information insert into database

after activate user create shop with existing user information

create some middleware for validation

##create user route -------------------------------------- => 'api/v1/users/create-user',
##activate user with email validation route -------------- => 'api/v1/users/verify/:token'
##user login route --------------------------------------- => '/api/v1/users/auth-user-login'
##user logout route -------------------------------------- => '/api/v1/users/auth-user-logout'
##user access token generate with refresh token ---------- => '/api/v1/users/auth-manage-token'
##find users with multiple search query also pagination -- => 'api/v1/users/find-users'
##find single user bt id --------------------------------- => 'api/v1/users/find-user/:id'

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

##must be an user should login and authority use like - shop_owner or shop_admin to create category
##require data for creating category.
=> category: string (unique)(max-100-min-3)

##Category routes
##create category route ----------------------------------- => 'api/v1/categories/create-category',
##get single category using multiple params ----------- => 'api/v1/categories/find-category/:param',
##get all categories using multiple query ------------- => 'api/v1/categories/find-categories?search',
##delete category single or multiple ------------------ => 'api/v1/categories/remove',
when want to delete -- send category_id making array then send it with request body,

##getting categories using multiple query "shop_name and category"
