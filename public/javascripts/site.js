import NodeRsa from 'node-rsa';

// example usage of chunked-client-upload
// with some DOM manipulation here and there for UX in example app

// import Uploader from 'chunked-client-upload';

$(function() {
	let $form = $('#upload-form');
	let $formFileInput = $('input[type="file"');
	let $formSubmitBtn = $form.find('button[type="submit"]');
	let $loader = $('#loader');

	// get Blob from file input

	let triggerLoadingUi = () => {
		$formSubmitBtn.addClass('disabled');
		$('#loader').transition('fade up');
	};

	let resetLoadingUi = () => {
		$formSubmitBtn.removeClass('disabled');
		$('#loader').transition('hide');
	};

	// test function until the chunked-client-upload package is complete
	let publicKey;
	let token;
	function testUploadContent() {
		fetch('/upload/token?totalNumChunks=2&encryptAlg=rsa').then((response) => {
			return response.json();
		}).catch((e) => {
			console.log('Error in retrieving token.');
			console.log(e)
		}).then((jsonResponse) => {
			console.log(jsonResponse);
			publicKey = new NodeRsa();
			publicKey.setOptions({ environment: 'browser' });
			publicKey.importKey(jsonResponse.registered.encryptPublicKey);

			token = jsonResponse.token;

			const dynamicPayload1 = 'Hello world! The current date is: ';
			const dynamicPayload2 = new Date().toString();

			// nested fetches, woo!
			fetch('/upload', {
				method: 'POST',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					token: token,
					chunkIdentifier: 0,
					data: publicKey.encrypt(dynamicPayload1)
				})
			}).then((response) => {
				console.log('First chunk uploaded.');

				fetch('/upload', {
					method: 'POST',
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						token: token,
						chunkIdentifier: 1,
						data: publicKey.encrypt(dynamicPayload2)
					})
				}).then((response) => {
					console.log('Second chunk uploaded.')
					resetLoadingUi();
				}).catch((e) => {
					console.log('Error in second chunk uploaded');
				});
			})
			.catch((e) => {
				console.log('Error in first chunk uploaded');
				console.log(e);
			});
		});
	}

	$form.on('submit', (e) => {
		e.preventDefault();
		
		// UX
		triggerLoadingUi();

		// Stub
		function Uploader() {};
		let uploader = new Uploader();

		let file;
		if (file = $formFileInput[0].files[0]) {
			// File extends Blob, so we can simply pass the selected file to the 
			// uploader
			// TODO: chunk-client-uploader.upload(file)
			testUploadContent();
		} else {
			resetLoadingUi();
		}
	});
});