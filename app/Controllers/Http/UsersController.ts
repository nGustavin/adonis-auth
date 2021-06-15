import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from "App/Models/User";

export default class UsersController {

    public async index (){
        return User.all()
    }

    public async create ({request, response}: HttpContextContract){
        const {name, username, password, email} = request.only(['name', 'username', 'password', 'email'])

        const usernameAlreadyInUse = await User.findBy('username', username)
        const emailAlreadyInUse = await User.findBy('email', email)

        if(usernameAlreadyInUse){
            return response.status(409).json({message: `User with username: ${username}, already exists`})
        }else if(emailAlreadyInUse){
            return response.status(409).json({message: `User with e-mail: ${email}, already exists`})
        }

        const user = await User.create({
            email,
            name,
            username,
            password
        })

        return user
        
    }
}