import should from "should";
import Livia from 'livia';
import OrientDBAdapter from '../src/Adapter';
import Schema from '../src/schemas/Schema';
import Edge from '../src/schemas/Edge';
import Vertex from '../src/schemas/Vertex';
import { waterfall } from "async";

const { Linked, ObjectId } = Schema.Types;

var connection = null;

describe('Schema', function() {
  var schema = null;

  it('should be able to create simple schema', function() {
    schema = new Schema({
      name: { type: String }
    });
  });

  it('should be able to create data class', function() {
    var data = new schema.DataClass({});
    data.name = 'Zlatko Fedor';

    data.name.should.equal('Zlatko Fedor');
  });
});

describe('Connection', function() {
  var schema = null;
  var User = null;

  it('should be able to create a simple schema', function() {
    schema = new Schema({
      name    : { type: String, required: true, index: true },
      isAdmin : { type: Boolean, default: false, readonly: true },
      points  : { type: Number, default: 30, notNull: true, min: 0, max: 99999 },
      hooked  : { type: String },
      address : {
        city   : { type: String, default: 'Kosice' },
        street : { type: String }
      },
      tags    : [String],
      images   : [{
        title: { type: String, required: true },
        created: { type: Date }
      }]
    });

    schema.pre('save', function(done) {
      this.hooked = 'Hooked text';
      this.tags.push('Test');
      done();
    });

    schema.virtual('niceName').get(function() {
      return 'Mr. ' + this.name;
    });

    schema.methods.getFormatedPoints = function() {
      return 'Points: ' + this.points;
    };

    schema.statics.getStaticValue = function() {
      return 'Static value';
    };

    var nameOptions = schema.getPath('name');
    nameOptions.type.should.equal(String);
    nameOptions.options.required.should.equal(true);
    nameOptions.options.index.should.equal(true);

    var cityOptions = schema.getPath('address.city');
    cityOptions.type.should.equal(String);
    cityOptions.options.default.should.equal('Kosice');

    var tagsOptions = schema.getPath('tags');
    Array.isArray(tagsOptions.type).should.equal(true);

    schema.setPath('address.zip', {
      type: Number,
      default: null
    });

    var zipOptions = schema.getPath('address.zip');
    zipOptions.type.should.equal(Number);
    should(zipOptions.options.default).equal(null);
  });

  it('should be able to create a connection', function(done) {
    var adapter = new OrientDBAdapter ({
      host: 'localhost',
        port: 2424,
        username: 'root',
        password: 'poklop943!'
    }, 'GratefulDeadConcerts');

    connection = new Livia(adapter, function(err) {
      if(err) throw err;
      done();
    });
  });

  it('should be able to create a simple model and assign to existing schema', function(done) {
    var schemaVerySimple = new Schema({
      title: { type: String }
    });

    connection.model('Article', schemaVerySimple, function(err, ArticleModel) {
      if(err) {
        throw err;
      }

      schema.add({
        articles: {
          type: [ArticleModel]
        }
      });

      done();
    });
  });

  it('should be able to create a model', function(done) {
    connection.model('User', schema, function(err, UserModel) {
      if(err) {
        throw err;
      }

      User = UserModel;
      User.getStaticValue().should.equal('Static value');

      done();
    });
  });

  var rid = null;

  it('should be able to create a document', function(done) {
    var user1 = new User({
      name: 'Zlatko Fedor',
      address: {
        street: 'Huskova 19'
      }
    });

    user1.name.should.equal('Zlatko Fedor');
    user1.isAdmin.should.equal(false);
    user1.points.should.equal(30);
    user1.niceName.should.equal('Mr. Zlatko Fedor');

    user1.getFormatedPoints().should.equal('Points: 30');

    user1.isNew.should.equal(true);


    user1.save(function(err, userSaved) {
      if(err) {
        throw err;
      }

      userSaved.hooked.should.equal('Hooked text');

      rid = userSaved.rid;
      done();
    });
  });

  it('should be able to create a document by upsert', function(done) {
    User.update({
      name: 'Zlatko Fedor 2'
    }, {
      name: 'Zlatko Fedor 2',
      address: {
        '@type': 'document',
        '@class': 'UserAAddress',
        street: 'Huskova 19'
      }
    }, {
      upsert: true,
      new: true
    }, function(err, userSaved) {
      if(err) {
        throw err;
      }

      should.exist(userSaved);

      userSaved.remove(function(err2){
        if (err2) {
          throw err2;
        }

        done();
      });
    });
  });


  it('should be able to find a document', function(done) {
    User.findOne(rid, function(err, user) {
      if(err) {
        throw err;
      }

      user.name.should.equal('Zlatko Fedor');
      user.isAdmin.should.equal(false);
      user.points.should.equal(30);
      user.niceName.should.equal('Mr. Zlatko Fedor');
      user.hooked.should.equal('Hooked text');
      user.rid.toString().should.equal(rid.toString());

      user.address.street.should.equal('Huskova 19');
      user.address.city.should.equal('Kosice');

      done();
    });
  });

  it('should be able to use toJSON', function(done) {
    User.findOne(rid, function(err, user) {
      if(err) {
        throw err;
      }

      var json = user.toJSON({
        virtuals: true
      });

      json.name.should.equal('Zlatko Fedor');
      json.isAdmin.should.equal(false);
      json.points.should.equal(30);
      json.niceName.should.equal('Mr. Zlatko Fedor');
      json.hooked.should.equal('Hooked text');
      json.tags.length.should.equal(1);

      json.address.street.should.equal('Huskova 19');
      json.address.city.should.equal('Kosice');

      done();
    });
  });

  it('should be able to set properties by path', function(done) {
    User.findOne(rid, function(err, user) {
      if(err) {
        throw err;
      }

      user.set({
        points: 45,
        address: {
          city: 'Presov'
        },
        'address.street': 'Svabska',
      });

      user.points.should.equal(45);
      user.address.street.should.equal('Svabska');
      user.address.city.should.equal('Presov');

      user.get('points').should.equal(45);
      user.get('address.street').should.equal('Svabska');

      user.save(function(err) {
        if (err) {
          throw err;
        }

        done();
      });
    });
  });

  it('should be able to use avg function', function(done) {
    var User = connection.model('User');

    User.avg('points').exec(function(err, total) {
      if(err) {
        throw err;
      }

      total.should.equal(45);

      done();
    });
  });

  it('should be able to use count function', function(done) {
    var User = connection.model('User');

    User.count().exec(function(err, total) {
      if(err) {
        throw err;
      }

      total.should.equal(1);

      done();
    });
  });

  it('should be able to remove a document', function(done) {
    User.remove(rid, function(err, total) {
      if(err) {
        throw err;
      }

      total.should.equal(1);

      done();
    });
  });

  it('should be able to get User model', function(done) {
    var UserModel = connection.model('User');
    UserModel.should.equal(User);
    done();
  });
});

describe('V', function() {
  it('should be able to create model Person extended from V', function(done) {
    var personSchema = new Vertex({
      name: { type: String },
      value: { type: Number, default: 0 },
      tags: { type: [String], isSet: true }
    });

    var Person = connection.model('Person', personSchema, function(err) {
      if(err) {
        throw err;
      }

      done();
    });
  });

  it('should be able to create document1', function(done) {
    var Person = connection.model('Person');

    new Person({
      name: 'Zlatko Fedor'
    }).save(function(err, person) {
      if(err) {
        throw err;
      }

      done();
    });
  });

  it('should be able to create document2', function(done) {
    var Person = connection.model('Person');

    new Person({
      name: 'Luca'
    }).save(function(err, person) {
      if(err) {
        throw err;
      }

      done();
    });
  });
});

describe('E', function() {
  it('should be able to create edge model extended from E', function(done) {
    var followSchema = new Edge({
      when: { type: Date, default: Date.now, required: true }
    }, {
      unique: true
    });

    var Follow = connection.model('Follow', followSchema, function(err) {
      if(err) {
        throw err;
      }
      done();
    });
  });

  var edge = null;
  var p1 = null;
  var p2 = null;

  it('should be able to create edge beetwean two person', function(done) {
    var Follow = connection.model('Follow');
    var Person = connection.model('Person');


    waterfall([
      function(callback) {
        Person.findOne({
          name: 'Zlatko Fedor'
        }, callback);
      },
      function(person1, callback) {
        p1 = person1;

        Person.findOne({
          name: 'Luca'
        }, function(err, person2) {
          if(err) {
            return callback(err);
          }

          p2 = person2;

          callback(null, person1, person2);
        });
      },
      function(p1, p2, callback) {

        new Follow({
        }).from(p1).to(p2).save(function(err, follow) {
          if(err) {
            return callback(err);
          }

          edge = follow;


          callback(null);
        });
      }
    ], function(err) {
      if(err) {
        throw err;
      }

      done();
    });
  });

  it('should be able to remove edge', function(done) {
    edge.remove(function(err, total) {
      if(err) {
        throw err;
      }

      total.should.equal(1);

      done();
    });
  });

  it('should be able to update vertex p1 and use increment', function(done) {
    var Person = connection.model('Person');

    Person.update(p1, {
      name: 'Adam',
      $inc: {
        value: 21
      },
      $addToSet: {
        tags: ['456', '888']
      }
    }, function(err, total) {
      if(err) {
        throw err;
      }

      total.should.equal(1);

      Person.findOne(p1, function(err, person) {
        if(err) {
          throw err;
        }

        person.value.should.equal(21);
        person.tags.toJSON().should.containDeep(['456', '888']);

        done();
      });
    });
  });

  it('should be able to remove vertex p1', function(done) {
    p1.remove(function(err, total) {
      if(err) {
        throw err;
      }

      total.should.equal(1);

      done();
    });
  });

  it('should be able to remove vertex p2', function(done) {
    p2.remove(function(err, total) {
      if(err) {
        throw err;
      }

      total.should.equal(1);

      done();
    });
  });
});



describe('RID', function() {
  it('should be able to create edge model extended from E', function(done) {
    const User = connection.model('User');

    const likeSchema = new Schema({
      user: { type: User, required: true },
      value: { type: Number, default: 2 }
    });

    const Like = connection.model('Like', likeSchema, function(err) {
      if (err) {
        throw err;
      }

      done();
    });
  });

  let user = null;
  let like = null;
  let like2 = null;

  it('should be able to create user', function(done) {
    const User = connection.model('User');

    const user1 = new User({
      name: 'Zlatko Fedor RID',
      address: {
        street: 'Huskova 19'
      }
    });

    user1.save(function(err, newUser) {
      if (err) {
        throw err;
      }

      should.exist(newUser);

      const rid = newUser.get('@rid').toString();
      should.exist(rid);

      user = newUser;

      user1.toJSON({ metadata: true }).should.containEql({
        '@rid': rid,
        '@type': 'd',
        '@class': 'User',
        name: 'Zlatko Fedor RID',
        isAdmin: false,
        points: 30,
        hooked: 'Hooked text',
        address:
         { city: 'Kosice',
           street: 'Huskova 19',
           '@type': 'd',
           '@class': 'UserAAddress',
           zip: null },
        tags: [ 'Test' ],
        images: []
      });

      newUser.toJSON({ metadata: true }).should.containEql({
        '@rid': rid,
        '@type': 'd',
        '@class': 'User',
        name: 'Zlatko Fedor RID',
        isAdmin: false,
        points: 30,
        hooked: 'Hooked text',
        address:
         { city: 'Kosice',
           street: 'Huskova 19',
           '@type': 'd',
           '@class': 'UserAAddress',
           zip: null },
        tags: [ 'Test' ],
        images: []
      });

      done();
    });
  });

  it('should be able to create like by existing user', function(done) {
    const Like = connection.model('Like');

    const like1 = new Like({
      user: user
    });

    const json = like1.toJSON({ metadata: true });
    json.user.should.containEql({
      '@rid': user.get('@rid').toString(),
      '@class': 'User'
    });

    json.should.containEql({
      '@class': 'Like'
    });

    const jsonCreate = like1.toJSON({ metadata: true, create: true });
    jsonCreate.should.containEql({
      '@class': 'Like',
      user: json.user['@rid']
    });



    const obj = like1.toObject({ metadata: true });
    obj.user.should.containEql({
      '@rid': user.get('@rid'),
      '@class': 'User'
    });

    obj.should.containEql({
      '@class': 'Like'
    });

    const objCreate = like1.toObject({ metadata: true, create: true });
    objCreate.should.containEql({
      '@class': 'Like',
      user: obj.user['@rid']
    });


    like1.save(function(err, newLike) {
      if(err) {
        throw err;
      }

      should.exist(newLike);

      like = newLike;

      const rid = newLike.get('@rid').toString();
      should.exist(rid);

      like1.toJSON({ metadata: true }).should.containEql({
        '@class': 'Like',
        '@type': 'd',
        'value': 2,
        'user': json.user['@rid']
      });

      done();
    });
  });


  it('should be able to create like by non existing user', function(done) {
    const validObj = {
      '@class': 'Like',
      value: 2,
      user: {
        '@type': 'd',
        '@class': 'User',
        name: 'Adam',
        address: {
          '@class': 'UserAAddress',
          '@type': 'd',
          city: 'Brezno',
          zip: null
        },
        articles: [],
        images: [],
        isAdmin: false,
        name: 'Adam',
        points: 30,
        tags: []
      }
    };

    const Like = connection.model('Like');

    const like1 = new Like({
      user: {
        name: 'Adam',
        address: {
          city: 'Brezno'
        }
      }
    });

    const json = like1.toJSON({ metadata: true });
    json.should.containEql(validObj);

    const jsonCreate = like1.toJSON({ metadata: true, create: true });
    jsonCreate.should.containEql(validObj);


    const obj = like1.toObject({ metadata: true });
    obj.should.containEql(validObj);

    const objCreate = like1.toObject({ metadata: true, create: true });
    objCreate.should.containEql(validObj);


    like1.save(function(err, newLike) {
      if(err) {
        throw err;
      }

      should.exist(newLike);

      const rid = newLike.get('@rid').toString();
      should.exist(rid);

      like1.toJSON({ metadata: true }).should.containEql({
        '@class': 'Like',
        '@type': 'd',
        'value': 2
      });

      should.exist(like1.user);

      const User = connection.model('User');
      User.remove(like1.user, function(err2) {
        if (err2) {
          throw err2;
        }

        like1.remove(function(err3) {
          if (err3) {
            throw err3;
          }

          done();
        });
      });
    });
  });

  it('should be able to remove user', function(done) {
    user.remove(function(err, total) {
      if(err) {
        throw err;
      }

      total.should.equal(1);

      done();
    });
  });

  it('should be able to remove like', function(done) {
    like.remove(function(err, total) {
      if(err) {
        throw err;
      }

      total.should.equal(1);

      done();
    });
  });

  it('should be able to create model Comment ', function(done) {
    const User = connection.model('User');

    const commentSchema = new Schema({
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      usersSet: {
        type: [{
          type: Schema.Types.ObjectId,
          ref: 'User'
        }],
        isSet: true
      },
      userDirect: { type: User, required: true },
      usersDirect: [User],
      usersSetDirect: {
        type: [User],
        isSet: true
      },

      userEmbedded: {
        name: { type: String },
        firstName: String
      },
      usersEmbedded: [{
        name: { type: String },
        firstName: String
      }],
      usersSetEmbedded: {
        type: [{
          name: { type: String },
          firstName: String
        }],
        isSet: true
      },
      value: { type: Number, default: 2 }
    });

    // linked
    const userPath = commentSchema.getPath('user');
    userPath.SchemaType.should.equal(Linked);
    userPath.SchemaType.isEmbedded(userPath).should.equal(false);
    userPath.SchemaType.getDbType(userPath).should.equal('LINK');

    const usersPath = commentSchema.getPath('users');
    usersPath.SchemaType.should.equal(Schema.Types.Array);
    usersPath.SchemaType.isEmbedded(usersPath).should.equal(false);
    usersPath.SchemaType.getDbType(usersPath).should.equal('LINKLIST');

    const usersSetPath = commentSchema.getPath('usersSet');
    usersSetPath.SchemaType.should.equal(Schema.Types.Array);
    usersSetPath.SchemaType.isEmbedded(usersSetPath).should.equal(false);
    usersSetPath.SchemaType.getDbType(usersSetPath).should.equal('LINKSET');

    // direct linked
    const userPathDirect = commentSchema.getPath('userDirect');
    userPathDirect.SchemaType.should.equal(Linked);
    userPathDirect.SchemaType.isEmbedded(userPathDirect).should.equal(false);
    userPathDirect.SchemaType.getDbType(userPathDirect).should.equal('LINK');

    const usersPathDirect = commentSchema.getPath('usersDirect');
    usersPathDirect.SchemaType.should.equal(Schema.Types.Array);
    usersPathDirect.SchemaType.isEmbedded(usersPathDirect).should.equal(false);
    usersPathDirect.SchemaType.getDbType(usersPathDirect).should.equal('LINKLIST');

    const usersSetPathDirect = commentSchema.getPath('usersSetDirect');
    usersSetPathDirect.SchemaType.should.equal(Schema.Types.Array);
    usersSetPathDirect.SchemaType.isEmbedded(usersSetPathDirect).should.equal(false);
    usersSetPathDirect.SchemaType.getDbType(usersSetPathDirect).should.equal('LINKSET');

    // embedded
    const userPathEmbedded = commentSchema.getPath('userEmbedded');
    userPathEmbedded.SchemaType.should.equal(Schema.Types.Object);
    userPathEmbedded.SchemaType.isEmbedded(userPathEmbedded).should.equal(true);
    userPathEmbedded.SchemaType.getDbType(userPathEmbedded).should.equal('EMBEDDED');

    const usersPathEmbedded = commentSchema.getPath('usersEmbedded');
    usersPathEmbedded.SchemaType.should.equal(Schema.Types.Array);
    usersPathEmbedded.SchemaType.isEmbedded(usersPathEmbedded).should.equal(true);
    usersPathEmbedded.SchemaType.getDbType(usersPathEmbedded).should.equal('EMBEDDEDLIST');

    const usersSetPathEmbedded = commentSchema.getPath('usersSetEmbedded');
    usersSetPathEmbedded.SchemaType.should.equal(Schema.Types.Array);
    usersSetPathEmbedded.SchemaType.isEmbedded(usersSetPathEmbedded).should.equal(true);
    usersSetPathEmbedded.SchemaType.getDbType(usersSetPathEmbedded).should.equal('EMBEDDEDSET');

    const Comment = connection.model('Comment', commentSchema, function(err) {
      if (err) {
        throw err;
      }

      done();
    });

    const comment = new Comment({
      user: { name: 'user1' },
      users: [{ name: 'user2' }],
      usersSet: [{ name: 'user3' }],
      userDirect: { name: 'user4' },
      usersDirect: [{ name: 'user5' }],
      usersSetDirect: [{ name: 'user6' }],
      userEmbedded: { name: 'user7' },
      usersEmbedded: [{ name: 'user8' }],
      usersSetEmbedded: [{ name: 'user9' }],
      value: 5
    });

    const json = comment.toJSON();
    json.user.should.containEql({ name: 'user1' });
    json.users[0].should.containEql({ name: 'user2' });
    json.usersSet[0].should.containEql({ name: 'user3' });

    json.userDirect.should.containEql({ name: 'user4' });
    json.usersDirect[0].should.containEql({ name: 'user5' });
    json.usersSetDirect[0].should.containEql({ name: 'user6' });

    json.userEmbedded.should.containEql({ name: 'user7' });
    json.usersEmbedded[0].should.containEql({ name: 'user8' });
    json.usersSetEmbedded[0].should.containEql({ name: 'user9' });

    comment.setAsOriginal();

    comment.toObject({
      metadata: true,
      modified: true
    }).should.containEql({});
  });
});

