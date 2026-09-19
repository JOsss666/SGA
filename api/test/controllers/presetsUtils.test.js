import inventoryController from "../../controllers/inventoryController.js";

const testGetPresets = async()=>{
    let x = await inventoryController.getInternalPresets([
        {id:1,units:2,name:'Hola'},
        {id:2,units:1,name:'Hola 2'},
    ])
    console.log('Test get items preset: ',x);
}

//testGetPresets();