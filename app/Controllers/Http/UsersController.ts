import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { AppError } from 'App/Exceptions/AppError';
import Hash from '@ioc:Adonis/Core/Hash'

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

        return response.status(201).json(user)
        
    }


    public async update ({request, response}: HttpContextContract){

        const { id } = request.params()
        const user = await User.findOrFail(id)

        

        const userDoesNotExist = await User.findBy('id', id)

        if(!userDoesNotExist){ // If user does not exists
            return response.status(404).json({message: "User does not exists"})
            
        }
        
        // If user exists, we validate request body
        const schema = yup.object().shape({
            name: yup.string().max(45, {message: "Name can be a maximum of 45 characters"}),
            email: yup.string().email({message: "Email must be a valid email"}).max(45, {message: "Email can be a maximum of 45 characters"}),
            username: yup.string().max(25, {message: "Username can be a maximum of 25 characters"}),
        })
        try{
            await schema.validate(request.only([ 'name', 'username', 'email' ]), {abortEarly: false})
        } catch(err){
            throw new AppError(err)
        }
        
        const { name, username, email } = request.only(['name', 'username', 'email'])

        user.merge({
            email: email,
            name: name,
            username: username,
        }).save()

        return response.status(200).json(user)
    }

    public async delete ({request, response}: HttpContextContract){
        const { id } = request.params()
        const user = await User.findBy('id', id)

        if(user){
            await user.delete()
            return response.status(200).json({message: `User '${user.name}' has been deleted`})
        }

        return response.status(404).json({message: "User not found"})
    }

    public async login ({auth, request, response}: HttpContextContract){
        const email = request.input('email')
        const password = request.input('password')

        const userDoesNotExist = await User.findBy('email', email)

        if(!userDoesNotExist){
            return response.status(404).json({message: "User not found"})
        }

        const user = await User
            .query()
            .where('email', email)
            .firstOrFail()

        
        if(!(await Hash.verify(user.password, password))){
            return response.badRequest('Invalid Credentials')
        }

        if(user){
            await auth.use('web').login(user)
            return response.status(200).json(user)  
        }

        
    }

    public async logout ({auth, request, response}: HttpContextContract){
        await auth.use('web').logout()
        return response.status(200).json({message: "Logged out"})
    }

    public async dashboard ({auth, request, response}: HttpContextContract){
        await auth.use('web').authenticate()
        return response.json(auth.use('web').user!)
    }
}