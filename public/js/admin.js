const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    const productElement = btn.closest('article');

    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {'csrf-token': csrf}
    })
    .then(result => {
        return result.json();
    })
    .then(data => {
        productElement.parentNode.removeChild(productElement);
    })
    .catch(err => {
        console.log(err);
    })
};

let buttons = document.querySelectorAll("button.btn.delete");

for(let  btn of buttons){
    // console.log(btn.getAttribute('id'));
    btn.addEventListener('click',()=>{
        deleteProduct(btn);
    });
}