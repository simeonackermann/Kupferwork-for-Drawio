/**
 * Some Drawio extensions
 *
 * Graph is global object of: src/main/webapp/js/grapheditor/Graph.js
 * ui is EditorUI: src/main/webapp/js/diagramly/EditorUi.js
 */

/**
 * Create CHOWLK diagram from CSV header columns
 * @param {*} ui
 */
function chowlkFromCSV(ui) {

    var graph = ui.editor.graph;

    mxResources.parse('chowlkFromCSV=CHOWLK from CSV');

    function importCSV(data) {
        // TODO may optional syle, URIs, etc...

        // Makes the import one undoable edit
		graph.getModel().beginUpdate();
		try
		{
            ui.importCsv(data, function(cells) {
                // console.log('KUPFER after import CSV, done?!!!', cells);
            })
        }
        catch (e) {
            console.log("KUPFER: something went wrong", e);
            ui.alert(`Failed to import CSV. Error: ${e.toString()}`);
        }
        finally
		{
			graph.getModel().endUpdate();
		}
    }


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
            if (input.files != null)
            {
                // Only one file for now...
                var reader = new FileReader();

                reader.onload = function(e)
                {
                    importCSV(e.target.result);
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

    var menu = ui.menus.get('insert');
	var oldFunct = menu.funct;

	menu.funct = function(menu, parent)
	{
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

    return;

    var graph = ui.editor.graph;
    var model = graph.getModel()
    var root = model.getRoot()

    console.log('KUPFERWORK, model:', model);
    console.log('KUPFERWORK, model.root:', root);
    console.log('KUPFERWORK, model.root.childAt(0):', root.getChildAt(0));
    console.log('KUPFERWORK, model.root.childAt(0).getChildCount:', model.getChildCount());
    console.log('KUPFERWORK, model.cells:', model.cells);
    // console.log('KUPFERWORK, model.children:', model.getChildren(graph.getDefaultParent())); -> null

    // Click handler for chromeless mode
	console.log('ui.editor.isChromelessView()', ui.editor.isChromelessView());

    function handleClickNode(cell) {
        // console.log('KUPFERWORK, clicked cell', cell);
        // console.log('KUPFERWORK, clicked cell graph.label:', graph.getLabel(cell));
        // console.log('KUPFERWORK, clicked cell cell.value:', cell.value, cell.getValue());
        if (cell.getValue().startsWith("foaf:website")) {
            console.log('KUPFERWORK: it is a foaf:website! ;)');

        }
    }

    graph.click = function(me)
    {
        // var evt = me.getEvent();
        var cell = me.getCell();
        if (cell && model.isVertex(cell)) handleClickNode(cell)
    };

    graph.getModel().beginUpdate();
			try
			{
				for (var id in graph.getModel().cells)
				{
					var cell = graph.getModel().cells[id];
                    console.log('cell anim', cell);

					if (graph.getModel().isVertex(cell) || graph.getModel().isEdge(cell))
					{
                        console.log('setCellStyle', cell);
						graph.setCellStyles('opacity', '0', [cell]);
						graph.setCellStyles('noLabel', '1', [cell]);
					}
				}
			}
			finally
			{
				graph.getModel().endUpdate();
			}


    // for (var id in model.cells) {
    //     var cell = model.cells[id];
    //     console.log('KUPFERWORK, cell', id, cell);
    // }
    // console.log('KUPFERWORK, graph.selected-cells:', graph.getSelectionCells()); -> empty

});