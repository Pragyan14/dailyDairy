function validatePassword() {
    var password = $("#password").val();
    var confirmPassword = $("#confirmPassword").val();
    
    if (password !== confirmPassword) {
    $("#error").css("display","block");
      return false;
    } else {
      return true;
    }
  }