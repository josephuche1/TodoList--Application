$(".check").change(function(){
  let textId = $(this).data("text-id");
  let textToChange = $(".task-text").eq(textId);

  if($(this).prop("checked")){
    textToChange.addClass("text-decoration-line-through");
  }
  else{
    textToChange.removeClass("text-decoration-line-through");
  }
});