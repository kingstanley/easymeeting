import { Injectable } from '@angular/core';

const tinymceInit = {
  plugins: [
    'advlist autolink autoresize lists link image charmap print preview hr anchor pagebreak',
    'searchreplace wordcount visualblocks visualchars code fullscreen',
    'insertdatetime media nonbreaking save table directionality',
    'emoticons template paste  textpattern spellchecker'
  ],

  base_url: '/tinymce', // Root for resources
  suffix: '.min', // Suffix to use when loading resources
  toolbar:
    'formatselect | image | bold italic strikethrough forecolor backcolor | link | alignleft aligncenter alignright alignjustify  | numlist bullist outdent indent  | removeformat',
  image_advtab: true,
  file_picker_callback(cb, value, meta) {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.setAttribute('spellcheck', 'true');

    // Note: In modern browsers input[type="file"] is functional without
    // even adding it to the DOM, but that might not be the case in some older
    // or quirky browsers like IE, so you might want to add it to the DOM
    // just in case, and visually hide it. And do not forget do remove it
    // once you do not need it anymore.

    input.onchange = function() {
      const file = input.files[0];

      const reader = new FileReader();
      reader.onload = function() {
        // Note: Now we need to register the blob in TinyMCEs image blob
        // registry. In the next release this part hopefully won't be
        // necessary, as we are looking to handle it internally.

        // to upload to the server write your upload code here and return the url pointing to the uploaded file
        // then asign it to the cb function inplace of the base64 string

        const base64 = reader.result;
        // let blobInfo = blobCache.(id, file, base64);
        // blobCache.add(blobInfo);

        // call the callback and populate the Title field with the file name
        cb(base64, { title: file.name });
      };
      reader.readAsDataURL(file);
    };

    input.click();
  }
};

@Injectable({
  providedIn: 'root'
})
export class TinymceService {

  constructor() { }

  init() {
    return tinymceInit;
  }

  apiKey(){
    return "vzt6j1we710aaj4ccfqyafgv3rifo25jtbmf0n7b6kw4v2yv";
  }
}
