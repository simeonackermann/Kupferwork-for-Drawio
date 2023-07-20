/**
 * Some Drawio extensions
 *
 * Graph is global object of: src/main/webapp/js/grapheditor/Graph.js
 * ui is EditorUI: src/main/webapp/js/diagramly/EditorUi.js
 */

function liveDetections(ui) {

    console.log('liveDetections', ui);
    var graph = ui.editor.graph;

    var allCells = graph.getModel().getChildren(graph.getDefaultParent());
    console.log('allcells', allCells);

    allCells

    // TODO maybe as grapoh.listener!?, see drawio.git/src/main/webapp/plugins/tooltips.js
    // TODO or ma find mxEvent if new cell is created ... and attach editor.addEvent(event ..)
    var editorUiOnKeyDown = ui.onKeyDown;
    ui.onKeyDown = function(evt) {

        // TODO also on remove cells,
        // TODO also when add/remove cells with mouse/menu ?!?!?
        if (evt.which == 13 && mxEvent.isControlDown(evt)) {
            var cell = graph.getSelectionCell();
            // console.log('liveDetections, EnterPressed', evt.which, 'CtrlDown:', mxEvent.isControlDown(evt));
            console.log('liveDetections, selected cell', {cell, cellAttributeType: cell.getAttribute('type')});
            console.log('liveDetections, parent cell', graph.model.getParent(cell), 'parentAttrType:', graph.model.getParent(cell).getAttribute('type'));


            if (cell.getAttribute('type') !== "propertyConstraint") return

            var psCell = graph.model.getParent(cell)
            if (psCell.getAttribute('type') !== "propertyShape") return

            var psCellC = graph.model.getParent(psCell)
            if (psCellC.getAttribute('type') !== "propertyShapeContainer") return

            // graph.getModel().beginUpdate();
            var cellGeom = graph.getCellGeometry(psCell).clone()
            cellGeom.height += cell.geometry.height
            console.log('WE ARE IN !!! RESIZE =>', psCellC, 'new height:', {cellGeom});
            try {
                graph.model.setGeometry(psCellC, cellGeom);
            }
            finally {
                console.log('liveDetection.FINALLY!!!');
                // graph.getModel().endUpdate();
                // mxEvent.consume(evt);
            }
        }

        editorUiOnKeyDown.apply(this, arguments);
        // if (!mxEvent.isConsumed(evt))
        // {
        //     console.log('LiveDetection.isConsumed?!?');
        // }
    }
}

function createCustomLibrary(ui) {

    var graph = ui.editor.graph;

    console.log('createCustomLibrary', ui);

    if (ui.sidebar === null) return;

    mxResources.parse('createKupferLibrary=Create drawio4kupfer library');

    ui.actions.addAction('createKupferLibrary', function() {
        // alert('createKupferLibrary');

        // var graph = this.editor.graph;
        var allCells = graph.getModel().getChildren(graph.getDefaultParent());
        var selection = graph.getSelectionCells();
        var viewState = graph.getViewState();
        var page = this.currentPage;

        var notCompressed = true;
        var selectionOnly = false;
        var noPages = false;

        var basename = ui.getBaseFilename(!noPages);

        var xmlData = Graph.xmlDeclaration +'\n' +
            ui.getFileData(true, null, null, null, !selectionOnly, !noPages,
                null, null, null, notCompressed);

        console.log('createCustomLibrary.xml data', xmlData);
        console.log('createCustomLibrary.getModel()', graph.getModel());
        console.log('createCustomLibrary.allCells', allCells);
        // console.log('createCustomLibrary.selection', selection);

        // var xmlModel = ui.emptyDiagramXml()

        allCells.forEach(cell => {
            console.log('createCustomLibrary.cell', {cell, 'attribute(ID)': cell.getAttribute('ID'), text: cell.textContent, label: cell.getAttribute('label'), value: cell.value, valueAttr: cell.getAttribute('value')});
        })

        var rulesCell = allCells.find(cell => cell.getAttribute('ID') == 'rules')

        if (!rulesCell || !rulesCell.getAttribute('label')) {
            console.log('ERROR; no ontlogy defoinition found...');
            return;
        }

        var rulesJson = JSON.parse(rulesCell.getAttribute('label').replace(/\s/g, ""));

        console.log('Ontology Cell', {rulesCell, rulesJson});

        return;

        var libraryElements = []

        allCells.filter(cell => !cell.edge).forEach(cell => {
            console.log('createCustomLibrary.cell', {cell});
            libraryElements.push({
                'xml': `<mxGraphModel><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/><mxCell id=\"2\" value=\"${cell.value}\" style=\"${cell.style}\" vertex=\"1\" parent=\"1\"><mxGeometry width=\"${cell.geometry.width}\" height=\"${cell.geometry.height}\" as=\"geometry\"/></mxCell></root></mxGraphModel>`,
                'w': cell.geometry.width,
                "h": cell.geometry.height,
                "aspect": "fixed",
                "title": cell.value
            })
        });



        // Dialog: drawio.git/src/main/webapp/js/diagramly/Dialogs.js#10973
        // Prototyp: drawio.git/src/main/webapp/js/diagramly/App.js#4290
        // var libraryElements = [
        //     {
        //         "xml": "<mxGraphModel><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/><mxCell id=\"2\" value=\"&lt;div&gt;&lt;b&gt;base&lt;/b&gt;: http://base.namespace.com&lt;/div&gt;&lt;div&gt;&lt;b&gt;other:&lt;/b&gt; http://other.namespace.com&lt;br&gt;&lt;/div&gt;\" style=\"shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;\" vertex=\"1\" parent=\"1\"><mxGeometry width=\"290\" height=\"100\" as=\"geometry\"/></mxCell></root></mxGraphModel>",
        //         "w": 290,
        //         "h": 100,
        //         "aspect": "fixed",
        //         "title": "namespaces"
        //     }
        // ]
        var file = null
        var mode = 'browser' // 'file'/'browser'
        ui.saveLibrary("Diagrams.net 4 RDF.xml", libraryElements, file, mode);

        // Create Library from tempplate, see
        // /home/simi/Projekte/Infai/Kupfer/Drawio4RDF/drawio.git/src/main/webapp/js/diagramly/sidebar/Sidebar-Advanced.js

        // Adds custom sidebar entry
        // ui.sidebar.addPalette('kupfer', 'Diagrams 4 RDF', true, function(content) {

        //     // content.appendChild(ui.sidebar.createVertexTemplate(null, 120, 60));
        //     // content.appendChild(ui.sidebar.createVertexTemplate('shape=image;image=http://download.esolia.net.s3.amazonaws.com/img/eSolia-Logo-Color.svg;resizable=0;movable=0;rotatable=0', 100, 100));
        //     content.appendChild(ui.sidebar.createVertexTemplate('text;spacingTop=-5;fontFamily=Courier New;fontSize=8;fontColor=#999999;resizable=0;movable=0;rotatable=0', 100, 100));
        //     content.appendChild(ui.sidebar.createVertexTemplate('rounded=1;whiteSpace=wrap;gradientColor=none;fillColor=#004C99;shadow=1;strokeColor=#FFFFFF;align=center;fontColor=#FFFFFF;strokeWidth=3;fontFamily=Courier New;verticalAlign=middle', 100, 100));
        //     content.appendChild(ui.sidebar.createVertexTemplate('curved=1;strokeColor=#004C99;endArrow=oval;endFill=0;strokeWidth=3;shadow=1;dashed=1', 100, 100));
        // });
    });

    var menu = ui.menus.get('extras');
	var oldFunct = menu.funct;

	menu.funct = function(menu, parent) {
		oldFunct.apply(this, arguments);

		ui.menus.addMenuItem(menu, 'createKupferLibrary', parent);

        // var item = ui.menus.addMenuItem(menu, 'exportTTL', parent);
        // item.parentNode.insertBefore(item, item.previousSibling.previousSibling)
	};


}

/**
 * Create CHOWLK diagram from CSV header columns
 * @param {*} ui
 */
function chowlkFromCSV(ui) {

    var importPlugin = null

    // add script
    mxscript("plugins/kupferwork/csv2ChowlkPlugin.js", function() {
        importPlugin = new csv2ChowlkPlugin(ui);
    }, null, null, true);

    mxResources.parse('chowlkFromCSV=CSV as CHOWLK...');

    ui.actions.addAction('chowlkFromCSV', function() {

        if (!Graph.fileSupport) return

        if (typeof ui.impFMFileInputElt !== 'undefined')  {
            ui.impFMFileInputElt.click();
            return;
        }

        var input = document.createElement('input');
        input.setAttribute('type', 'file');

        mxEvent.addListener(input, 'change', function()
        {
            if (input.files != null) {
                var reader = new FileReader();

                reader.onload = function(e) {
                    importPlugin.importCSV(e.target.result, function(cells) {
                        console.log('CSV 2 CHOWLK, Done', {cells});
                    })
                };

                reader.readAsText(input.files[0]);

                // Resets input to force change event for same file (type reset required for IE)
                input.type = '';
                input.type = 'file';
                input.value = '';
            }
        });

        input.style.display = 'none';
        document.body.appendChild(input);
        ui.impFMFileInputElt = input;
        ui.impFMFileInputElt.click();
    });

    var menu = ui.menus.get('insertAdvanced');
	var oldFunct = menu.funct;

	menu.funct = function(menu, parent) {
		oldFunct.apply(this, arguments);

		ui.menus.addMenuItems(menu, ['-', 'chowlkFromCSV'], parent);
	};
}

/**
 * Export diagramm as TTL, use chowlk API t convert from XML to turtle
 * @param {*} ui
 */
function exportAsTTL(ui) {

    var graph = ui.editor.graph;
    var chowlkApi = 'https://app.chowlk.linkeddata.es/api';

    // TODO may only available if CZOWLk is installed?!?

    mxResources.parse('exportTTL=TTL (by chowlk) ...');

    ui.actions.addAction('exportTTL', function() {
        var compressed = false;
        var selectionOnly = false;
        var noPages = false;

        var basename = ui.getBaseFilename(!noPages);

        var xmlData = Graph.xmlDeclaration +'\n' +
            ui.getFileData(true, null, null, null, !selectionOnly, !noPages,
                null, null, null, compressed);

        formData = new FormData();
        formData.append('data', new File([xmlData], `${basename}.xml`));
        fetch(chowlkApi, {
            method: 'POST',
            body: formData,
        })
        .then(res => {
            return res.json()
        })
        .then(res => {
            if (!res.ttl_data || res.ttl_data == "") {
                console.error('Failed to convert diagram as turtle. Reponse: ', res);
                ui.alert(`Failed to convert diagram as turtle. Reponse message: ${JSON.stringify(res.errors)}`);
                return
            }

            if (Object.keys(res.errors).length) {
                // TODO show an error/warning
                console.warn('Convert warning from chowlk API:', res.errors);
            }
            ui.saveData(`${basename}.ttl`, 'ttl', res.ttl_data, 'text/turtle');
        })
        .catch(e => {
            console.log( 'FETCH err: ', e);
            ui.alert(JSON.stringify(e));
        })
    });

    var menu = ui.menus.get('exportAs');
	var oldFunct = menu.funct;

	menu.funct = function(menu, parent) {
		oldFunct.apply(this, arguments);
		var item = ui.menus.addMenuItem(menu, 'exportTTL', parent);
        item.parentNode.insertBefore(item, item.previousSibling.previousSibling)
	};
}

Draw.loadPlugin(function(ui) {

    exportAsTTL(ui)

    chowlkFromCSV(ui)

    // createCustomLibrary(ui)

    // liveDetections(ui)

});