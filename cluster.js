const cluster = require('cluster');
const os = require('os');

// *** Make DB call
const numberOfUsersInDB = function(){
  this.count = this.count || 5;
  this.count = this.count * this.count;
  return this.count;
};

if (cluster.isMaster) {
  const cpus = os.cpus().length;
  for (let i = 0; i < cpus; i++) {
    cluster.fork();
  }
  console.dir(cluster.workers, { depth: 0 });
  const updateWorkers = () => {
    const userCounts = numberOfUsersInDB();
    Object.values(cluster.workers).forEach(worker => {
      worker.send({ userCounts });
    });
  };
  updateWorkers();
  setInterval(updateWorkers, 1)
} else {
  require('./server')
}