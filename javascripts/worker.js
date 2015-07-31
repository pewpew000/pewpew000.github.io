<script>
importScripts('main.js');	// help to use the object functions directly.

var world_state;
var world_states;
var time_of_last;	// simulate the case for TCP, so assume no break of order.
var 

onmessage = function( oEvent ){
	var tmp = JSON.parse(oEvent)
	switch( tmp.getClass() ){
		case "event":	// received events
			world_state.deploy();
			
			break;
		case "world_states":	// received world_state
			world_state = tmp;
			break;
		default:
			alert("shit happens");
	}
}

function reply()
</script>