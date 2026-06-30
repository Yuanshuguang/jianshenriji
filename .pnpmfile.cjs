module.exports = { hooks: { readPackage(pkg) { if (pkg.name === "dtrace-provider") pkg.scripts = {}; return pkg; } } };
