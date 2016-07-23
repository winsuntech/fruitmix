class syncmanager{
	constructor(){
		this.drives=[]
		this.libraries=[]
	}

	createDriveSync(){

	}

	createLibrarySync(uuid,parentname,childname){

	}

	findCheckpointInLibrarySync(hash){
		for(let i=0; i<libraries.length;i++){
			let x=libraries[i].uuidMap.get(hash)
			if(x) return x
		}
	}

	checkLibrarySync(hash,parentname,childname){
		let checkpoint = findCheckpointInLibrarySync(hash)
		if(!checkpoint) return new Error('hash not found')

		

	}

}