'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Users, Truck, TrendingUp, Clock, DollarSign, Loader2 } from "lucide-react"
import { dashboardService, type DashboardStats } from "@/lib/api-services"

// Contenu du Dashboard - Connecté à l'API
export default function DashboardContent() {
  // Récupérer les stats du dashboard depuis l'API
  const { 
    data: stats, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  })

  // État de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  // Erreur de chargement
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur de chargement</CardTitle>
            <CardDescription>
              Impossible de charger les données du dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} className="w-full">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header du Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de l'activité Fresh Dessert App
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-green-600">
            Système Actif
          </Badge>
          <Button onClick={() => refetch()}>
            <Clock className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPIs Principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes Totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCommandes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Données en temps réel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes Aujourd'hui</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.commandesAujourdhui || 0}</div>
            <p className="text-xs text-muted-foreground">
              Mises à jour automatiquement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livreurs Actifs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.livreursActifs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Disponibles pour livraison
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tournées en Cours</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tournesEnCours || 0}</div>
            <p className="text-xs text-muted-foreground">
              Actives actuellement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>
              Les dernières commandes et livraisons
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="text-center text-muted-foreground py-8">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2">Graphique d'activité à implémenter</p>
              <p className="text-sm">API: /api/stats/timeline</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Performance</CardTitle>
            <CardDescription>
              Métriques clés du service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">CA Aujourd'hui</span>
                </div>
                <span className="text-sm font-bold">€{stats?.chiffreAffaires || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Temps moyen livraison</span>
                </div>
                <span className="text-sm font-bold">{stats?.tempsMoyenLivraison || 0} min</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Taux de réussite</span>
                </div>
                <Badge variant="success">98.5%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>
            Actions fréquentes pour les admins et dispatchers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Nouvelle Commande
            </Button>
            <Button variant="outline">
              <Truck className="mr-2 h-4 w-4" />
              Créer Tournée
            </Button>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Gérer Livreurs
            </Button>
            <Button variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              Voir Stats
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}