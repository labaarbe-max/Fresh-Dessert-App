import { NextResponse } from 'next/server';
import { createDeliveryStock, bulkCreateDeliveryStocks } from '@/lib/db';
import { verifyToken, unauthorizedResponse, verifyRole } from '@/lib/auth-middleware';

export async function POST(request) {
    // Vérifier le token JWT
    const authResult = verifyToken(request);

    if (authResult.error) {
        return unauthorizedResponse(authResult.error);
    }

    // Vérifier les permissions (admin ou dispatcher uniquement)
    const roleCheck = verifyRole(authResult.user, ['admin', 'dispatcher']);
    if (roleCheck.error) {
        return NextResponse.json(
            { success: false, error: roleCheck.error },
            { status: 403 }
        );
    }

    try {
        const data = await request.json();

        // Création en masse (bulk)
        if (data.stocks && Array.isArray(data.stocks)) {
            // Validation
            if (!data.delivery_id) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Missing required field: delivery_id'
                    },
                    { status: 400 }
                );
            }

            const result = await bulkCreateDeliveryStocks(data.delivery_id, data.stocks);

            return NextResponse.json({
                success: true,
                message: `${result.insertedCount} stocks created successfully`,
                data: result
            }, { status: 201 });
        }

        // Création unitaire
        if (!data.delivery_id || !data.product_id || !data.initial_quantity) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: delivery_id, product_id, initial_quantity'
                },
                { status: 400 }
            );
        }

        const stock = await createDeliveryStock(data);

        return NextResponse.json({
            success: true,
            data: stock
        }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/stocks:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create stock',
                message: error.message
            },
            { status: 500 }
        );
    }
}