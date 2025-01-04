import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/database';

class AuthController {
    /**
     * Gestisce il login degli utenti amministrativi
     */
    async login(req: Request, res: Response) {
        try {
            const { username, password } = req.body;

            // Recupera l'utente dal database
            const [users] = await db.execute(
                'SELECT id, username, password_hash, role_id, is_active FROM admin_users WHERE username = ?',
                [username]
            );

            const user = users[0];

            // Verifica se l'utente esiste ed è attivo
            if (!user || !user.is_active) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Credenziali non valide'
                });
            }

            // Verifica la password
            const isValidPassword = await bcrypt.compare(password, user.password_hash);
            if (!isValidPassword) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Credenziali non valide'
                });
            }

            // Crea il token JWT
            const token = jwt.sign(
                { sub: user.id, username: user.username },
                process.env.JWT_SECRET as string,
                { expiresIn: '8h' }
            );

            // Aggiorna last_login
            await db.execute(
                'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );

            // Registra l'accesso nel log
            await db.execute(
                'INSERT INTO admin_activity_log (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    user.id,
                    'LOGIN',
                    'AUTH',
                    user.id,
                    JSON.stringify({ timestamp: new Date() }),
                    req.ip
                ]
            );

            return res.json({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        role_id: user.role_id
                    }
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Errore durante il login'
            });
        }
    }

    /**
     * Verifica se il token dell'utente è ancora valido
     */
    async verifyToken(req: Request, res: Response) {
        try {
            // req.user è già stato popolato dal middleware di autenticazione
            const user = req.user;

            return res.json({
                status: 'success',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        role_id: user.role_id
                    }
                }
            });
        } catch (error) {
            return res.status(401).json({
                status: 'error',
                message: 'Token non valido'
            });
        }
    }
}

export default new AuthController();