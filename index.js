const mysql = require("mysql2");
const inquirer = require("inquirer");
const ct = require('console.table')
// const sql = require("./sql");

//CONNECTING TO MYSQL
const connection = mysql.createConnection({
    host: 'localhost',

    // X port | Default is 3306
    port: 3306,
    user: 'root',
    password: 'mariana123',
    database: 'employeesDB'
});

connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as Id " + connection.threadId);
    console.log(`
    Welcome to your Employee Tracker!`)
    
    firstPrompt();
});
function firstPrompt() {

  inquirer
    .prompt({
      type: "list",
      name: "task",
      message: "What would you like to do?",
      choices: [
        "View Employees",
        "View Employees by Department",
        "Add Employee",
        "Remove Employees",
        "Update Employee Role",
        "Add Role",
        "End"]
    })
    .then(function ({ task }) {
      switch (task) {
        case "View Employees":
          viewEmployee();
          break;

        case "View Employees by Department":
          viewEmployeeByDepartment();
          break;
      
        case "Add Employee":
          addEmployee();
          break;

        case "Remove Employees":
          removeEmployees();
          break;

        case "Update Employee Role":
          updateEmployeeRole();
          break;

        case "Add Role":
          addRole();
          break;

        case "End":
          connection.end();
          break;
      }
    });
}


function viewEmployee() {
  console.log("Viewing employees\n");

  var query =
    `SELECT employee.Id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
  FROM employee employee
  LEFT JOIN role role
	ON employee.role_Id = role.Id
  LEFT JOIN department department
  ON department.Id = role.department_Id
  LEFT JOIN employee manager
	ON manager.Id = employee.manager_Id`

  connection.query(query, function (err, res) {
    if (err) throw err;

    console.table(res);
    console.log("Employees viewed!\n");

    firstPrompt();
  });

}
function viewEmployeeByDepartment() {
  console.log("Viewing employees by department\n");

  var query =
    `SELECT department.Id, department.name, role.salary AS budget
  FROM employee employee
  LEFT JOIN role role
	ON employee.role_Id = role.Id
  LEFT JOIN department department
  ON department.Id = role.department_Id
  GROUP BY department.Id, department.name`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const departmentChoices = res.map(data => ({
      value: data.Id, name: data.name
    }));

    console.table(res);
    console.log("Department view succeed!\n");

    promptDepartment(departmentChoices);
  });
}
function promptDepartment(departmentChoices) {

  inquirer
    .prompt([
      {
        type: "list",
        name: "departmentId",
        message: "Which department would you choose?",
        choices: departmentChoices
      }
    ])
    .then(function (answer) {
      console.log("answer ", answer.departmentId);

      var query =
        `SELECT employee.Id, employee.first_name, employee.last_name, role.title, department.name AS department 
  FROM employee employee
  JOIN role role
	ON employee.role_Id = role.Id
  JOIN department department
  ON department.Id = role.department_Id
  WHERE department.Id = ?`

      connection.query(query, answer.departmentId, function (err, res) {
        if (err) throw err;

        console.table("response ", res);
        console.log(res.affectedRows + "Employees are viewed!\n");

        firstPrompt();
      });
    });
}
function addEmployee() {
  console.log("Inserting an employee!")

  var query =
    `SELECT role.Id, role.title, role.salary 
      FROM role role`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const roleChoices = res.map(({ id, title, salary }) => ({
      value: id, title: `${title}`, salary: `${salary}`
    }));

    console.table(res);
    console.log("RoleToInsert!");

    promptInsert(roleChoices);
  });
}
function promptInsert(roleChoices) {

  inquirer
    .prompt([
      {
        type: "Input",
        name: "First_name",
        message: "Please input employee's first name"
      },
      {
        type: "Input",
        name: "Last_name",
        message: "Please input employee's last name"
      },
      {
        type: "List",
        name: "Role_ID",
        message: "Please input employee's role",
        choices: roleChoices
      },
    ])
    .then(function (answer) {
      console.log(answer);

      var query = `INSERT INTO employee SET ?`
      // Here we can insert a new item into the database with that info
      connection.query(query,
        {
          first_name: answer.first_name,
          last_name: answer.last_name,
          role_id: answer.roleId,
          manager_id: answer.managerId,
        },
        function (err, res) {
          if (err) throw err;

          console.table(res);
          console.log(res.insertedRows + "Inserted successfully!\n");

          firstPrompt();
        });
    });
}

// REMOVING EMPLOYEES

function removeEmployees() {
  console.log("Deleting an employee");

  var query =
    `SELECT employee.Id, employee.first_name, employee.last_name
      FROM employee employee`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const deleteEmployeeChoices = res.map(({ id, first_name, last_name }) => ({
      value: id, name: `${id} ${first_name} ${last_name}`
    }));

    console.table(res);
    console.log("ArrayToDelete!\n");

    promptDelete(deleteEmployeeChoices);
  });
}

function promptDelete(deleteEmployeeChoices) {

  inquirer
    .prompt([
      {
        type: "list",
        name: "employeeId",
        message: "Which employee do you want to remove?",
        choices: deleteEmployeeChoices
      }
    ])
    .then(function (answer) {

      var query = `DELETE FROM employee WHERE ?`;
      connection.query(query, { id: answer.employeeId }, function (err, res) {
        if (err) throw err;

        console.table(res);
        console.log(res.affectedRows + "Deleted!\n");

        firstPrompt();
      });
    });
}

//UPDATING EMPLOYEE ROLES
function updateEmployeeRole() { 
  employeeArray();

}
function employeeArray() {
  console.log("Updating an employee");

  var query =
    `SELECT employee.Id, employee.first_name, employee.last_name, role.title, department.name AS department, role.salary, CONCAT(manager.first_name, ' ', manager.last_name) AS manager
  FROM employee employee
  JOIN role role
	ON e.role_Id = role.Id
  JOIN department department
  ON department.Id = role.department_Id
  JOIN employee manager
	ON manager.Id = e.manager_Id`

  connection.query(query, function (err, res) {
    if (err) throw err;

    const employeeChoices = res.map(({ id, first_name, last_name }) => ({
      value: id, name: `${first_name} ${last_name}`      
    }));

    console.table(res);
    console.log("employeeArray To Update!\n")

    roleArray(employeeChoices);
  });
}

function roleArray(employeeChoices) {
  console.log("Updating an role");

  var query =
    `SELECT role.Id, role.title, role.salary 
  FROM role role`
  let roleChoices;

  connection.query(query, function (err, res) {
    if (err) throw err;

    roleChoices = res.map(({ id, title, salary }) => ({
      value: id, title: `${title}`, salary: `${salary}`      
    }));

    console.table(res);
    console.log("roleArray to Update!\n")

    promptEmployeeRole(employeeChoices, roleChoices);
  });
}

function promptEmployeeRole(employeeChoices, roleChoices) {

  inquirer
    .prompt([
      {
        type: "list",
        name: "employeeId",
        message: "Which employee do you want to set with the role?",
        choices: employeeChoices
      },
      {
        type: "list",
        name: "roleId",
        message: "Which role do you want to update?",
        choices: roleChoices
      },
    ])
    .then(function (answer) {

      var query = `UPDATE employee SET role_Id = ? WHERE Id = ?`
      connection.query(query,
        [ answer.roleId,  
          answer.employeeId
        ],
        function (err, res) {
          if (err) throw err;

          console.table(res);
          console.log(res.affectedRows + "Updated successfully!");

          firstPrompt();
        });
    });
}

//ADDING EMPLOYEE ROLES
function addRole() {
  var query =
    `SELECT department.Id, department.name, role.salary AS budget
    FROM employee employee
    JOIN role role
    ON e.role_Id = role.Id
    JOIN department department
    ON department.Id = role.department_Id
    GROUP BY department.Id, department.name`

  connection.query(query, function (err, res) {
    if (err) throw err;

    // (callbackfn: (value: T, index: number, array: readonly T[]) => U, thisArg?: any)
    const departmentChoices = res.map(({ id, name }) => ({
      value: id, name: `${id} ${name}`
    }));

    console.table(res);
    console.log("Department array!");

    promptAddRole(departmentChoices);
  });
}

function promptAddRole(departmentChoices) {

  inquirer
    .prompt([
      {
        type: "input",
        name: "roleTitle",
        message: "Role title?"
      },
      {
        type: "input",
        name: "roleSalary",
        message: "Role Salary"
      },
      {
        type: "list",
        name: "departmentId",
        message: "Department?",
        choices: departmentChoices
      },
    ])
    .then(function (answer) {

      var query = `INSERT INTO role SET ?`

      connection.query(query, {
        title: answer.title,
        salary: answer.salary,
        department_id: answer.departmentId
      },
        function (err, res) {
          if (err) throw err;

          console.table(res);
          console.log("Role Inserted!");

          firstPrompt();
        });

    });
}