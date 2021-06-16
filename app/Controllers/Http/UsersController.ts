import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { AppError } from 'App/Exceptions/AppError';

import User from "App/Models/User";

import * as yup from 'yup'

export default class UsersController {

    public async index (){
        return User.all()
    }

    public async create ({request, response}: HttpContextContract){

        const schema = yup.object().shape({
            name: yup.string().required({message: "Name is a required field"}).max(45, {message: "Name can be a maximum of 45 characters"}),
            email: yup.string().email({message: "Email must be a valid email"}).required({message: "E-mail is a required field"}).max(45, {message: "Email can be a maximum of 45 characters"}),
            username: yup.string().max(25, {message: "Username can be a maximum of 25 characters"}),
            password: yup.string().required({message: "Password is a required field"}).min(8, {message: "Password must be at least 8 characters long"})
        })

        try{
            await schema.validate(request.only(['name', 'username', 'password', 'email']), {abortEarly: false})
        } catch(err){
            throw new AppError(err)
        }

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