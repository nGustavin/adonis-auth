import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import User from "App/Models/User";

export default class UsersController {

    public async index (){
        return User.all()
    }

    public async create ({request}: HttpContextContract){
        const {name, username, password, email} = request.only(['name', 'username', 'password', 'email'])

        const user = await User.create({
            email,
            name,
            username,
            password
        })

        return user
        
    }
    
}