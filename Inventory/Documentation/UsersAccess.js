

// Permisos Usuario Serivicio Inventario

const inventoryAccess = {
    auth_key:'',
    auth_by:'',
    user_access:true,
    sections_access: [],
    stores_acces:[], // Store_id, Store2_id
    cellars_acces:[], // Cellar_di, Cella2_id
    information:{
        reports:{
            rotation:true,
            inventoryValue:true,
            stocks:true,
            movements:true,
            transactions:true,
            priceINventory:true,
            modifications:true,
            dateInventoey:true,
        },
        others_operations:false
    },
    actions:{
        modify_movments:true,
        modify_credentials:true,
        create_users:true,
        movements:{
            create_entries:true,
            create_departures:true,
            create_consumptions:true,
            create_transfers:true
        }
    }
}