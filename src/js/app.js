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
    // Graph
    dims: {
        svgWidth: 1200,
        svgHeight: 600,
        marginLeft: 50,
        marginRight: 50,
        marginTop: 50,
        marginBottom: 50,
        graphHeight: null, 
        graphWidth: null,
    },
    svg: null,
    graph: null,
    stratify: null,
    colorScale: null,

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
            
            // Update graph
            app.updateGraph(app.data);
        });

        // Init graph
        app.initGraph();
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

    // Graph
    initGraph: function() {
        // Dimensions
        app.dims.graphWidth = app.dims.svgWidth - app.dims.marginLeft - app.dims.marginRight,
        app.dims.graphHeight = app.dims.svgHeight - app.dims.marginTop - app.dims.marginBottom

        // Containers settings
        app.svg = d3.select('.canvas')
            .append('svg')
            .attr('width', app.dims.svgWidth)
            .attr('height', app.dims.svgHeight);
        
        app.graph = app.svg.append('g')
            .attr('width', app.dims.graphWidth)
            .attr('height', app.dims.graphHeight)
            .attr('transform', `translate(${app.dims.marginLeft}, ${app.dims.marginTop})`);

        // Ordinal scale
        app.colorScale = d3.scaleOrdinal()
            .range(d3.schemeDark2)

        // Data stratufy
        app.stratify = d3.stratify()
            .id(d => d.name)
            .parentId(d => d.parent);
    },

    updateGraph: function(data) {
        // Remove current nodes and links
        app.graph.selectAll('.node').remove();
        app.graph.selectAll('.link').remove();

        // Update scale
        const colorDomain = [];

        for (const elt of data) {
            colorDomain.push(elt.department);
        }
        
        app.colorScale
            .domain(new Set(colorDomain));

        // Stratify data
        const rootNodes = app.stratify(data);

        // Tree data
        const tree = d3.tree()
            .size([app.dims.graphWidth, app.dims.graphHeight]);

        const treeData = tree(rootNodes);

        // Get nodes selection and join datas
        const nodes = app.graph.selectAll('.node')
            .data(treeData.descendants());

        // Get links selection and join datas
        const links = app.graph.selectAll('.link')
            .data(treeData.links());

        const enterLinks = links
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', '#aaa')
            .attr('stroke-width', 2)
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y)
            );

        const enterNodes = nodes
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`);

        enterNodes
            .append('rect')
            .attr('fill', d => app.colorScale(d.data.department))
            .attr('stroke', '#555')
            .attr('stroke-width', '2px')
            .attr('width', d => d.data.name.length * 20)
            .attr('height', 50)
            .attr('transform', d => {
                const x = d.data.name.length * 20;
                return `translate(${-x/2}, -32)`
            })

        enterNodes
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('fill', 'white')
            .text(d => d.data.name);
    },
};

document.addEventListener('DOMContentLoaded', app.init);
