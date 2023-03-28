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

    mxResources.parse('chowlkFromCSV=CSV as CHOWLK...');

    // keep original Graph.prototype.setAttributeForCell to restore after import
    var _org_setAttributeForCell = Graph.prototype.setAttributeForCell
    Graph.prototype.setAttributeForCell()

    // overwrite Graph.prototype.setAttributeForCell
    //      to avoid <UserObject> wrapper
    function setAttributeForCell(cell, attributeName, attributeValue) {
        if (attributeValue != null) {
            cell.setAttribute(attributeName, attributeValue);
        } else {
            cell.removeAttribute(attributeName);
        }

        if (attributeName == "label") {
            cell.value = `ns:${attributeValue}`
        }
    }


    function importCSV(data) {
        // TODO may optional syle, URIs, etc...
        var csvTml = `## CSV styles
## label: %label%<br>(%uri%)
# style: rounded=0;whiteSpace=wrap;html=1;snapToPoint=1;
## labelname: value
## parentstyle: -`

        data = `${csvTml}\n${data}`

        Graph.prototype.setAttributeForCell = function(a, b, c) {
            setAttributeForCell(a,b,c)
        }

        // Makes the import one undoable edit
		graph.getModel().beginUpdate();
		try
		{
            ui.importCsv(data, function(cells) {
                // TODO may afterworks do something with cells ?!
                // restore Graph.prototype.setAttributeForCell after success
                Graph.prototype.setAttributeForCell = _org_setAttributeForCell
            })
        }
        catch (e) {
            console.log("KUPFER: something went wrong", e);
            ui.alert(`Failed to import CSV. Error: ${e.toString()}`);
            // restore Graph.prototype.setAttributeForCell after fail
            Graph.prototype.setAttributeForCell = _org_setAttributeForCell

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
            if (input.files != null) {
                var reader = new FileReader();

                reader.onload = function(e) {
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

});