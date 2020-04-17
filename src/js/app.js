const app = {
    // Targets
    modal: document.querySelector('.modal'),
    form: document.querySelector('form'),
    name: document.getElementById('name'),
    parent: document.getElementById('parent'),
    department: document.getElementById('department'),
    modalInstance: null,
    // Datas
    data: [],

    // App init
    init: function() {
        // Init modal
        app.modalInstance = M.Modal.init(app.modal);

        // Handle submit
        app.form.addEventListener('submit', app.handleSubmit);

        // Listening Firesbase
        db.collection('employees').onSnapshot((snapshot) => {
            snapshot.docChanges().forEach(change => {
                // Catch the doc
                const doc = {...change.doc.data(), id: change.doc.id};
                // Catch the change type
                const changeType = change.type;
                // Refresh local data
                app.refreshData(doc, changeType);
            });
            console.log(app.data)
        });
    },

    // Methods
    handleSubmit: function(evt) {
        evt.preventDefault();

        db.collection('employees').add({
            name: app.name.value,
            parent: app.parent.value,
            department: app.department.value
        })
        .then(function(docRef) {
            console.log("Document written with ID: ", docRef.id);
        })
        .catch(function(error) {
            console.error("Error adding document: ", error);
        });

        app.form.reset();

        app.modalInstance.close();
    },

    // CRUD operation
    refreshData: function(doc, changeType) {
        switch (changeType) {
            case 'added':
                app.data.push(doc);
                break;
            
            case 'modified':
                app.data.forEach((element, index) => {
                    if (element.id === doc.id) {
                        app.data[index] = doc;
                    }
                })
                break;

            case 'removed':
                app.data.forEach((element, index) => {
                    if (element.id === doc.id) {
                        app.data.splice(index, 1);
                    }
                })
                break;

            default:
                break;
        }
    },
};

document.addEventListener('DOMContentLoaded', app.init);
