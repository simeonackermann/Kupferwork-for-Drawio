/**
 * Plugin to import Instance-Classes and properties from CSV
 */

csv2ChowlkPlugin = function(ui) {
    this.ui = ui;
    // this.init();
}

// csv2ChowlkPlugin.prototype.init = function() {
//     // console.log('csv2ChowlkPlugin INIT', typeof mxUtils);
// }

// TODO may optional syle, URIs, etc...
csv2ChowlkPlugin.prototype.csvTemplate = ``

csv2ChowlkPlugin.prototype.importCSV = function(data, done) {

    var graph = this.ui.editor.graph;

    data = `${this.csvTemplate}${data}`

    this.ui.loadOrgChartLayouts(mxUtils.bind(this, function()
		{
            graph.model.beginUpdate();
			try {
                this.doImportCsv_refactored(data, done);
            }
            catch (error) {
                console.log('Error', error);
                // TODO ui handling errors
                if (done != null) {
                    done(false)
                }
            }
            finally {
                graph.model.endUpdate();
            }
	}));
}

csv2ChowlkPlugin.prototype.doImportCsv_refactored = function(data, done) {

    var graph = this.ui.editor.graph;
    var createdCells = []

    // console.log('CSV 2 CHOWLK, import', {text: line});
    var pt = graph.getFreeInsertPoint();
    var index = 0
    var lines = data.split('\n');

    if (lines.length == 0) {
        console.log('Error: no lines');
        return done(false)
    }
    // console.log('CSV 2 CHOWLK, data.lines', {data, lines});
    while (index < lines.length && lines[index].charAt(0) == '#') {
        var constLine = lines[index].replace(/\r$/,''); // Remove trailing \r if the file uses \r\n line breaks
        index++;
        while (index < lines.length && constLine.charAt(constLine.length - 1) == '\\' &&
        				lines[index].charAt(0) == '#')
        {
            constLine = constLine.substring(0, constLine.length - 1) + mxUtils.trim(lines[index].substring(1));
            index++;
        }
        // console.log('CSV 2 CHOWLK, meta', {constLine});

    }
    var headers = this.ui.editor.csvToArray(lines[index].replace(/\r$/,''));
    // console.log('CSV 2 CHOWLK', {headers});

    // TODO ignore empty lineds
    // TODO bad CSV lines/columns handling

    for (var i = index + 1; i < lines.length; i++) {
        var entry = this.ui.editor.csvToArray(lines[i].replace(/\r$/,''));
        // console.log('CSV 2 CHOWLK', {entry});

        var instance = this.addInstance(entry[0])
        createdCells.push(instance)
        for (let j = 0; j < entry.length; j++) {
            var property = this.addProperty(entry[j])
            var relation = this.addRelation(instance, property, headers[j])
            createdCells.push(property, relation)
        }
    }

    // Required for layouts to work with new cells
    graph.view.validate();
    var layout = new mxHierarchicalLayout(graph, mxConstants.DIRECTION_WEST);

    this.ui.executeLayout(function() {
        layout.execute(graph.getDefaultParent(), createdCells);
        // postprocess

        graph.moveCells(createdCells, pt.x, pt.y);

    }, true, function() {
        // select new cells after layouting coimplete ...
        graph.setSelectionCells(createdCells);
    	graph.scrollCellToVisible(graph.getSelectionCell());
    })

    return done(createdCells)

}

csv2ChowlkPlugin.prototype.addProperty = function (value, datatype = null) {
    // TODO improve prefix handling
    return datatype
        ? this.addCell(`"${value}"^^ns:${datatype}"`)
        : this.addCell(`"${value}"`)
}

csv2ChowlkPlugin.prototype.addInstance = function (value) {
    // TODO improve datatype/prefix handling
    return value.includes(":")
        ? this.addCell(`<u>${value}</u>`)
        : this.addCell(`<u>ns:${value}</u>`)
}

csv2ChowlkPlugin.prototype.addCell = function (value) {

    var graph = this.ui.editor.graph;
    var style = "rounded=0;whiteSpace=wrap;html=1;snapToPoint=1;"
    var label = value
    var width = 190;
    var height = 30;

    var cell = new mxCell(label, new mxGeometry(0, 0, width, height), style);
    cell.collapsed = false;
    cell.vertex = true;
    cell.value = value

    // console.log('CVS 2 CHOWLK, add cell', cell);
    // graph.fireEvent(new mxEventObject('cellsInserted', 'cells', [newCell]));
    return graph.addCell(cell, null);
}

csv2ChowlkPlugin.prototype.addRelation = function (fromCell, toCell, value) {
    // TODO improve prefix handling
    return value.includes(":")
        ? this.addEdge(fromCell, toCell, value)
        : this.addEdge(fromCell, toCell, `ns:${value}`)
}

csv2ChowlkPlugin.prototype.addEdge = function (fromCell, toCell, value) {

    var graph = this.ui.editor.graph;
    var style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;fontSize=12;'

    // console.log('CVS 2 CHOWLK, add edge', {fromCell, toCell});
    return graph.insertEdge(null, null, value, fromCell, toCell, style);
}