import { NextResponse } from 'next/server';
import { getStockById, updateDeliveryStock, deleteDeliveryStock } from '@/lib/db';
import { verifyToken, unauthorizedResponse, verifyRole } from '@/lib/auth-middleware';

export async function GET(request, { params }) {
    // Vérifier le token JWT
    const authResult = verifyToken(request);

    if (authResult.error) {
        return unauthorizedResponse(authResult.error);
    }

    try {
        const { id } = await params;

        // Récupérer le stock par ID
        const stock = await getStockById(id);

        if (!stock) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Stock not found'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: stock
        });
    } catch (error) {
        console.error('Error in GET /api/stocks/[id]:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch stock',
                message: error.message
            },
            { status: 500 }
        );
    }
}

export async function PUT(request, { params }) {
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
        const { id } = await params;
        const data = await request.json();

        // Vérifier que le stock existe
        const existingStock = await getStockById(id);

        if (!existingStock) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Stock not found'
                },
                { status: 404 }
            );
        }

        const stock = await updateDeliveryStock(id, data);

        return NextResponse.json({
            success: true,
            data: stock
        });
    } catch (error) {
        console.error('Error in PUT /api/stocks/[id]:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to update stock',
                message: error.message
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
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
        const { id } = await params;

        // Vérifier que le stock existe
        const existingStock = await getStockById(id);

        if (!existingStock) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Stock not found'
                },
                { status: 404 }
            );
        }

        await deleteDeliveryStock(id);

        return NextResponse.json({
            success: true,
            message: 'Stock deleted successfully'
        });
    } catch (error) {
        console.error('Error in DELETE /api/stocks/[id]:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to delete stock',
                message: error.message
            },
            { status: 500 }
        );
    }
}