var resume = {
    author: "楊世嘉",
    LastUpdateTime: "2016-01-23",
    version: "1.0.0",
    Init: init
};

function init(){

}

var app = angular.module('MyApp', []);
app.controller('Ctrl1',['$scope',function($scope){
    $scope.name = 'Hi I am Knock Yang';
}]);
