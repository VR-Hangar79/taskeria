import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';

// Estende l'interfaccia Request per includere l'utente autenticato
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

/**
 * Middleware per verificare il token JWT e autenticare le richieste
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Ottiene il token dall'header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ 
                status: 'error',
                message: 'Autenticazione richiesta' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verifica il token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        
        // Recupera l'utente dal database
        const [users] = await db.execute(
            'SELECT id, username, role_id, is_active FROM admin_users WHERE id = ? AND is_active = TRUE',
            [decoded.sub]
        );

        if (!users[0]) {
            return res.status(401).json({ 
                status: 'error',
                message: 'Utente non trovato o non attivo' 
            });
        }

        // Aggiunge l'utente alla richiesta
        req.user = users[0];
        next();
    } catch (error) {
        return res.status(401).json({ 
            status: 'error',
            message: 'Token non valido o scaduto' 
        });
    }
};

/**
 * Middleware per verificare i permessi dell'utente
 * @param requiredPermissions Array di permessi richiesti
 */
export const checkPermissions = (requiredPermissions: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    status: 'error',
                    message: 'Utente non autenticato' 
                });
            }

            // Recupera i permessi del ruolo dell'utente
            const [roles] = await db.execute(
                'SELECT permissions FROM admin_roles WHERE id = ?',
                [req.user.role_id]
            );

            const userPermissions = JSON.parse(roles[0].permissions || '[]');

            // Verifica se l'utente ha tutti i permessi richiesti
            const hasAllPermissions = requiredPermissions.every(
                permission => userPermissions.includes(permission)
            );

            if (!hasAllPermissions) {
                return res.status(403).json({ 
                    status: 'error',
                    message: 'Permessi insufficienti per questa operazione' 
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({ 
                status: 'error',
                message: 'Errore nella verifica dei permessi' 
            });
        }
    };
};